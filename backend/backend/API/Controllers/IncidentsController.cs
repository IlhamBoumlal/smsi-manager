using backend.Application.DTOs.Email;  // ← AJOUTER CETTE LIGNE
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
using backend.API.Hubs;  // ← AJOUTER CETTE LIGNE (si tu as un Hub SignalR)

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

        // ─────────────────────────────────────────────────────────────────────
        // NOUVEAU : IMPORT PAR EMAIL (SANS AUTHENTIFICATION)
        // ─────────────────────────────────────────────────────────────────────
        [AllowAnonymous]
        [HttpPost("email-import")]
        public async Task<IActionResult> ImportFromEmail([FromBody] EmailImportDto dto)
        {
            try
            {
                _logger.LogInformation("ImportFromEmail: Réception d'un email de {From}", dto?.From);

                if (dto == null || string.IsNullOrWhiteSpace(dto.Subject))
                {
                    return BadRequest(new { message = "Le sujet de l'email est obligatoire" });
                }

                // 1. Chercher l'utilisateur par son email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.From);

                int? societeId = null;

                if (user != null)
                {
                    // 2a. L'utilisateur existe → on prend son SocieteId
                    societeId = user.SocieteId;
                    _logger.LogInformation("Email associé à l'utilisateur {Email}, SocieteId={SocieteId}", dto.From, societeId);
                }
                else
                {
                    // 2b. L'utilisateur n'existe pas → on prend la SocieteId de l'admin (boumlalilham@gmail.com)
                    var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "boumlalilham@gmail.com");

                    if (adminUser != null)
                    {
                        societeId = adminUser.SocieteId;
                        _logger.LogInformation("Email {Email} non trouvé, association à la société de l'admin (SocieteId={SocieteId})",
                            dto.From, societeId);
                    }
                    else
                    {
                        _logger.LogWarning("Utilisateur admin boumlalilham@gmail.com non trouvé, SocieteId=NULL");
                    }
                }

                // 3. Créer l'incident
                var incident = new Incident
                {
                    Id = Guid.NewGuid(),
                    Titre = dto.Subject.Length > 200 ? dto.Subject.Substring(0, 200) : dto.Subject,
                    Description = dto.Body?.Length > 500 ? dto.Body.Substring(0, 500) : dto.Body,
                    Date = dto.ReceivedAt ?? DateTime.UtcNow,
                    Priorite = PrioriteIncident.MOYENNE,
                    Statut = StatutIncident.EnCours,
                    SocieteId = societeId
                };

                await _context.Incidents.AddAsync(incident);
                await _context.SaveChangesAsync();

                _logger.LogInformation("ImportFromEmail: Incident créé avec succès, Id={Id}, SocieteId={SocieteId}, Expéditeur={From}",
                    incident.Id, incident.SocieteId, dto.From);

                // 4. Notification SignalR
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    incidentId = incident.Id,
                    titre = incident.Titre,
                    priorite = "MOYENNE",
                    message = $"Nouvel incident créé par email : {incident.Titre}"
                });

                return Ok(new
                {
                    message = "Incident créé avec succès",
                    incidentId = incident.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'import d'email");
                return StatusCode(500, new { message = "Erreur interne", error = ex.Message });
            }
        }
    }
}