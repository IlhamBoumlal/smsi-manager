using backend.Application.DTOs.Email;
using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.API.Hubs;
using Microsoft.Extensions.Options;
using backend.Application.DTOs.Settings;

namespace backend.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class IncidentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<IncidentsController> _logger;
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly EmailMonitoringSettings _emailMonitoringSettings;

        public IncidentsController(
            IMediator mediator,
            ILogger<IncidentsController> logger,
            AppDbContext context,
            IHubContext<NotificationHub> hubContext,
            IOptions<EmailMonitoringSettings> emailMonitoringOptions)
        {
            _mediator = mediator;
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
            _emailMonitoringSettings = emailMonitoringOptions.Value;
        }

        private int? CurrentSocieteId
        {
            get
            {
                var raw = User.FindFirstValue("SocieteId")
                          ?? User.FindFirstValue("societeId")
                          ?? User.FindFirstValue("societe_id")
                          ?? User.FindFirstValue("companyId");

                if (int.TryParse(raw, out var value))
                    return value;

                return null;
            }
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] IncidentDto dto)
        {
            var id = await _mediator.Send(new CreateIncidentCommand(dto, CurrentSocieteId));
            return Ok(id);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] IncidentDto dto)
        {
            var result = await _mediator.Send(new UpdateIncidentCommand(id, dto, CurrentSocieteId));
            return result ? Ok() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _mediator.Send(new DeleteIncidentCommand(id, CurrentSocieteId));
            return result ? Ok() : NotFound();
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidentDto>>> GetAll()
        {
            var incidents = await _mediator.Send(new GetAllIncidentsQuery(CurrentSocieteId));
            return Ok(incidents);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IncidentDto>> GetById(Guid id)
        {
            var incident = await _mediator.Send(new GetIncidentByIdQuery(id, CurrentSocieteId));
            return incident == null ? NotFound() : Ok(incident);
        }

        // ── Import par email ────────────────────────────────────────────────
        [AllowAnonymous]
        [HttpPost("email-import")]
        public async Task<IActionResult> ImportFromEmail([FromBody] EmailImportDto dto)
        {
            try
            {
                _logger.LogInformation("ImportFromEmail: réception d'un email de {From}", dto?.From);

                // ── 1. Vérification de sécurité ──────────────────────────────
                bool isAuthenticated = User.Identity?.IsAuthenticated == true;
                bool hasInternalKey = Request.Headers.TryGetValue(
                                           "X-Internal-EmailImport-Key", out var providedKey)
                                       && !string.IsNullOrWhiteSpace(providedKey)
                                       && providedKey == _emailMonitoringSettings.InternalImportKey;

                if (!isAuthenticated && !hasInternalKey)
                {
                    _logger.LogWarning("ImportFromEmail: accès refusé — ni JWT ni clé interne valide");
                    return Unauthorized(new { message = "Accès non autorisé" });
                }

                // ── 2. Validation ─────────────────────────────────────────────
                if (dto == null || string.IsNullOrWhiteSpace(dto.Subject))
                    return BadRequest(new { message = "Le sujet de l'email est obligatoire" });

                // ── 3. Résolution du SocieteId ────────────────────────────────
                // Priorité : JWT > email expéditeur > email destinataire > premier RSSI > première société
                int? societeId = CurrentSocieteId;

                if (!societeId.HasValue && !string.IsNullOrWhiteSpace(dto.From))
                {
                    var sender = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Email == dto.From);

                    societeId = sender?.SocieteId;
                    if (societeId.HasValue)
                        _logger.LogInformation("SocieteId={Id} résolu depuis l'expéditeur {From}", societeId, dto.From);
                }

                if (!societeId.HasValue && !string.IsNullOrWhiteSpace(dto.To))
                {
                    var recipient = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Email == dto.To);

                    societeId = recipient?.SocieteId;
                    if (societeId.HasValue)
                        _logger.LogInformation("SocieteId={Id} résolu depuis le destinataire {To}", societeId, dto.To);
                }

                if (!societeId.HasValue)
                {
                    // Fallback : premier RSSI disponible
                    var rssiRoleId = await _context.Roles
                        .Where(r => r.Name == "RSSI")
                        .Select(r => r.Id)
                        .FirstOrDefaultAsync();

                    if (rssiRoleId != null)
                    {
                        societeId = await _context.Users
                            .Join(_context.UserRoles,
                                  u => u.Id,
                                  ur => ur.UserId,
                                  (u, ur) => new { u, ur })
                            .Where(x => x.ur.RoleId == rssiRoleId && x.u.SocieteId != null)
                            .Select(x => x.u.SocieteId)
                            .FirstOrDefaultAsync();
                    }

                    if (societeId.HasValue)
                        _logger.LogInformation("SocieteId={Id} résolu via fallback RSSI", societeId);
                }

                if (!societeId.HasValue)
                {
                    // Dernier fallback : première société existante
                    societeId = await _context.Societes
                        .Select(s => (int?)s.Id)
                        .FirstOrDefaultAsync();

                    if (societeId.HasValue)
                        _logger.LogInformation("SocieteId={Id} résolu via fallback première société", societeId);
                }

                if (!societeId.HasValue)
                {
                    _logger.LogError("ImportFromEmail: impossible de déterminer le SocieteId — aucune société en base");
                    return BadRequest(new { message = "Aucune société disponible pour associer cet incident" });
                }

                // ── 4. Création de l'incident ─────────────────────────────────
                var incident = new Incident
                {
                    Id = Guid.NewGuid(),
                    Titre = dto.Subject.Length > 200 ? dto.Subject[..200] : dto.Subject,
                    Description = BuildDescription(dto),
                    Date = dto.ReceivedAt ?? DateTime.UtcNow,
                    Priorite = PrioriteIncident.MOYENNE,
                    Statut = StatutIncident.EnCours,
                    SocieteId = societeId
                };

                await _context.Incidents.AddAsync(incident);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "ImportFromEmail: incident {Id} créé pour SocieteId={SocieteId}",
                    incident.Id, incident.SocieteId);

                // ── 5. Notification SignalR aux RSSI ──────────────────────────
                await SendNotificationToRssi(incident);

                return Ok(new { message = "Incident créé avec succès", incidentId = incident.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'import d'email");
                return StatusCode(500, new { message = "Erreur interne", error = ex.Message });
            }
        }

        // ── Notification SignalR aux RSSI de la société ─────────────────────
        private async Task SendNotificationToRssi(Incident incident)
        {
            var rssiRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "RSSI");
            if (rssiRole == null)
            {
                _logger.LogWarning("Rôle RSSI introuvable — aucune notification SignalR envoyée");
                return;
            }

            var query = _context.Users
                .Join(_context.UserRoles,
                      u => u.Id,
                      ur => ur.UserId,
                      (u, ur) => new { u, ur })
                .Where(x => x.ur.RoleId == rssiRole.Id);

            // Filtrer par société si connue, sinon notifier tous les RSSI
            if (incident.SocieteId.HasValue)
                query = query.Where(x => x.u.SocieteId == incident.SocieteId);

            var rssiUsers = await query.Select(x => x.u).ToListAsync();

            if (!rssiUsers.Any())
            {
                _logger.LogWarning("Aucun RSSI trouvé pour SocieteId={SocieteId}", incident.SocieteId);
                return;
            }

            var notification = new
            {
                type = "NewIncident",
                incidentId = incident.Id,
                titre = incident.Titre,
                description = incident.Description,
                priorite = incident.Priorite?.ToString() ?? "MOYENNE",
                date = incident.Date,
                message = $"📧 NOUVEL INCIDENT PAR EMAIL : {incident.Titre}",
                statut = "EnCours"
            };

            foreach (var user in rssiUsers)
            {
                if (string.IsNullOrEmpty(user.Email)) continue;

                try
                {
                    // Canal 1 : par userId (fonctionne si IUserIdProvider est configuré)
                    if (!string.IsNullOrEmpty(user.Id))
                    {
                        await _hubContext.Clients
                            .User(user.Id)
                            .SendAsync("ReceiveNotification", notification);
                    }

                    // Canal 2 : par groupe email (toujours fonctionnel via OnConnectedAsync)
                    var groupName = user.Email.ToLower()
                        .Replace("@", "_")
                        .Replace(".", "_");

                    await _hubContext.Clients
                        .Group(groupName)
                        .SendAsync("ReceiveNotification", notification);

                    _logger.LogInformation(
                        "✅ Notification SignalR envoyée à {Email} (userId={UserId}, groupe={Group})",
                        user.Email, user.Id, groupName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur SignalR pour {Email}", user.Email);
                }
            }
        }

        private static string BuildDescription(EmailImportDto dto)
        {
            var body = dto.Body?.Length > 500 ? dto.Body[..500] : dto.Body ?? "";
            return string.IsNullOrWhiteSpace(dto.From)
                ? body
                : $"De : {dto.From}\n\n{body}";
        }
    }
}