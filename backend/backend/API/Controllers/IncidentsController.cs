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

namespace backend.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class IncidentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<IncidentsController> _logger;
        private readonly AppDbContext _context;  // ← AJOUTER POUR LA SAUVEGARDE DIRECTE
        private readonly IHubContext<NotificationHub> _hubContext;  // ← AJOUTER POUR SIGNALR

        public IncidentsController(
            IMediator mediator,
            ILogger<IncidentsController> logger,
            AppDbContext context,
            IHubContext<NotificationHub> hubContext)  // ← AJOUTER CES PARAMÈTRES
        {
            _mediator = mediator;
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Récupère le SocieteId depuis le token JWT.
        /// Le claim doit s'appeler exactement "SocieteId" dans le token.
        /// </summary>
        private int? CurrentSocieteId
        {
            get
            {
                // Log tous les claims pour faciliter le débogage
                var allClaims = User.Claims.Select(c => $"{c.Type}={c.Value}");
                _logger.LogInformation("JWT Claims disponibles: {Claims}", string.Join(", ", allClaims));

                // Essayer plusieurs variantes de nom de claim
                var raw = User.FindFirstValue("SocieteId")
                          ?? User.FindFirstValue("societeId")
                          ?? User.FindFirstValue("societe_id")
                          ?? User.FindFirstValue("companyId");

                if (int.TryParse(raw, out var value))
                {
                    _logger.LogInformation("SocieteId extrait du JWT: {SocieteId}", value);
                    return value;
                }

                _logger.LogWarning("SocieteId introuvable ou invalide dans le JWT. Valeur brute: '{Raw}'", raw);
                return null;
            }
        }

        // POST api/incidents
        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] IncidentDto dto)
        {
            _logger.LogInformation("IncidentsController.Create: CurrentSocieteId = {SocieteId}", CurrentSocieteId);

            if (CurrentSocieteId == null)
            {
                _logger.LogWarning("Tentative de création d'incident sans SocieteId dans le JWT.");
            }

            var id = await _mediator.Send(new CreateIncidentCommand(dto, CurrentSocieteId));
            return Ok(id);
        }

        // PUT api/incidents/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] IncidentDto dto)
        {
            _logger.LogInformation("IncidentsController.Update: id={Id}, SocieteId={SocieteId}", id, CurrentSocieteId);
            var result = await _mediator.Send(new UpdateIncidentCommand(id, dto, CurrentSocieteId));
            return result ? Ok() : NotFound();
        }

        // DELETE api/incidents/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            _logger.LogInformation("IncidentsController.Delete: id={Id}, SocieteId={SocieteId}", id, CurrentSocieteId);
            var result = await _mediator.Send(new DeleteIncidentCommand(id, CurrentSocieteId));
            return result ? Ok() : NotFound();
        }

        // GET api/incidents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidentDto>>> GetAll()
        {
            _logger.LogInformation("IncidentsController.GetAll: CurrentSocieteId = {SocieteId}", CurrentSocieteId);
            var incidents = await _mediator.Send(new GetAllIncidentsQuery(CurrentSocieteId));
            return Ok(incidents);
        }

        // GET api/incidents/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<IncidentDto>> GetById(Guid id)
        {
            _logger.LogInformation("IncidentsController.GetById: id={Id}, SocieteId={SocieteId}", id, CurrentSocieteId);
            var incident = await _mediator.Send(new GetIncidentByIdQuery(id, CurrentSocieteId));
            return incident == null ? NotFound() : Ok(incident);
        }
        // ─────────────────────────────────────────────────────────────────────────────
        // IMPORT PAR EMAIL (SANS AUTHENTIFICATION) AVEC NOTIFICATION UNIQUEMENT AU RSSI
        // ─────────────────────────────────────────────────────────────────────────────
        [AllowAnonymous]
        [HttpPost("email-import")]
        public async Task<IActionResult> ImportFromEmail([FromBody] EmailImportDto dto)
        {
            try
            {
                _logger.LogInformation("ImportFromEmail: Réception d'un email de {From}", dto?.From);

                if (dto == null || string.IsNullOrWhiteSpace(dto.Subject))
                    return BadRequest(new { message = "Le sujet de l'email est obligatoire" });

                var fromEmail = dto.From?.Trim();
                if (string.IsNullOrEmpty(fromEmail))
                    return BadRequest(new { message = "L'adresse de l'expéditeur est obligatoire" });

                // 1. Déterminer le SocieteId (expéditeur ou admin par défaut)
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == fromEmail);
                int? societeId = user?.SocieteId;

                if (societeId == null)
                {
                    var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "boumlalilham@gmail.com");
                    societeId = adminUser?.SocieteId;

                    if (societeId != null)
                    {
                        _logger.LogInformation("Email {From} non trouvé, association à la société de l'admin (SocieteId={SocieteId})", fromEmail, societeId);
                    }
                    else
                    {
                        // Si l'admin n'a pas de SocieteId, utiliser le SocieteId d'un RSSI existant
                        var rssiRoleId = await _context.Roles
                            .Where(rr => rr.Name == "RSSI")
                            .Select(rr => rr.Id)
                            .FirstOrDefaultAsync();

                        societeId = await _context.Users
                            .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { u, ur })
                            .Where(x => x.ur.RoleId == rssiRoleId)
                            .Select(x => x.u.SocieteId)
                            .FirstOrDefaultAsync();

                        if (societeId != null)
                        {
                            _logger.LogInformation("Email {From} non trouvé, fallback sur la société d'un RSSI existant (SocieteId={SocieteId})", fromEmail, societeId);
                        }
                        else
                        {
                            societeId = await _context.Societes.Select(s => (int?)s.Id).FirstOrDefaultAsync();
                            _logger.LogInformation("Email {From} non trouvé, aucun admin/RSSI avec SocieteId ; fallback SocieteId={SocieteId}", fromEmail, societeId);
                        }
                    }
                }

                // 2. Créer l'incident
                var incident = new Incident
                {
                    Id = Guid.NewGuid(),
                    Titre = dto.Subject.Length > 200 ? dto.Subject[..200] : dto.Subject,
                    Description = dto.Body?.Length > 500 ? dto.Body[..500] : dto.Body,
                    Date = dto.ReceivedAt ?? DateTime.UtcNow,
                    Priorite = PrioriteIncident.MOYENNE,
                    Statut = StatutIncident.EnCours,
                    SocieteId = societeId
                };

                await _context.Incidents.AddAsync(incident);
                await _context.SaveChangesAsync();

                _logger.LogInformation("ImportFromEmail: Incident créé, Id={Id}, SocieteId={SocieteId}", incident.Id, incident.SocieteId);

                // 3. Envoyer la notification SignalR UNIQUEMENT AUX RSSI
                await SendNotificationToRssi(incident);

                return Ok(new { message = "Incident créé avec succès", incidentId = incident.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'import d'email");
                return StatusCode(500, new { message = "Erreur interne", error = ex.Message });
            }
        }

        // Méthode helper pour envoyer la notification uniquement aux utilisateurs avec le rôle RSSI
        private async Task SendNotificationToRssi(Incident incident)
        {
            // Récupérer l'Id du rôle "RSSI"
            var rssiRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "RSSI");
            if (rssiRole == null)
            {
                _logger.LogWarning("Rôle RSSI introuvable, aucune notification SignalR envoyée");
                return;
            }

            // Requête : utilisateurs RSSI, idéalement dans la même société.
            var rssiUsersQuery = _context.Users
                .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { u, ur })
                .Where(x => x.ur.RoleId == rssiRole.Id);

            if (incident.SocieteId.HasValue)
            {
                rssiUsersQuery = rssiUsersQuery.Where(x => x.u.SocieteId == incident.SocieteId);
            }

            var rssiUsers = await rssiUsersQuery
                .Select(x => x.u)
                .ToListAsync();

            if (!rssiUsers.Any())
            {
                _logger.LogWarning("Aucun utilisateur RSSI trouvé pour SocieteId={SocieteId}", incident.SocieteId);
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
                var groupName = user.Email.ToLower().Replace("@", "_").Replace(".", "_");
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
                _logger.LogInformation("✅ Notification SignalR envoyée à {Email} (groupe: {Group})", user.Email, groupName);
            }
        }

        
    }
}