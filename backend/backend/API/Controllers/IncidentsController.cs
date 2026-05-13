using backend.API.Hubs;
using backend.Application.DTOs.Email;
using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using backend.Application.Security;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [Authorize(Policy = "SmsiTenantScope")]
    [ApiController]
    [Route("api/[controller]")]
    [RequirePermission("incidents")]
    public class IncidentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<IncidentsController> _logger;
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public IncidentsController(
            IMediator mediator,
            ILogger<IncidentsController> logger,
            AppDbContext context,
            IHubContext<NotificationHub> hubContext)
        {
            _mediator = mediator;
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
        }

        private int? CurrentSocieteId
        {
            get
            {
                var raw = User.FindFirstValue("SocieteId")
                          ?? User.FindFirstValue("societeId")
                          ?? User.FindFirstValue("societe_id")
                          ?? User.FindFirstValue("companyId");

                return int.TryParse(raw, out var value) ? value : null;
            }
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] IncidentDto dto)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var id = await _mediator.Send(new CreateIncidentCommand(dto, CurrentSocieteId));
            return Ok(id);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] IncidentDto dto)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var result = await _mediator.Send(new UpdateIncidentCommand(id, dto, CurrentSocieteId));
            return result ? Ok() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var result = await _mediator.Send(new DeleteIncidentCommand(id, CurrentSocieteId));
            return result ? Ok() : NotFound();
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidentDto>>> GetAll()
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var incidents = await _mediator.Send(new GetAllIncidentsQuery(CurrentSocieteId));
            return Ok(incidents);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IncidentDto>> GetById(Guid id)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var incident = await _mediator.Send(new GetIncidentByIdQuery(id, CurrentSocieteId));
            return incident == null ? NotFound() : Ok(incident);
        }

        [HttpPost("email-import")]
        [RequirePermission("incidents", "import")]
        public async Task<IActionResult> ImportFromEmail([FromBody] EmailImportDto dto)
        {
            try
            {
                if (!CurrentSocieteId.HasValue)
                {
                    return Forbid();
                }

                if (dto == null || string.IsNullOrWhiteSpace(dto.Subject))
                {
                    return BadRequest(new { message = "Le sujet de l'email est obligatoire" });
                }

                if (!string.IsNullOrWhiteSpace(dto.From))
                {
                    var senderUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Email == dto.From);

                    if (senderUser is not null && senderUser.SocieteId != CurrentSocieteId.Value)
                    {
                        return Forbid();
                    }
                }

                var incident = new Incident
                {
                    Id = Guid.NewGuid(),
                    Titre = dto.Subject.Length > 200 ? dto.Subject[..200] : dto.Subject,
                    Description = dto.Body?.Length > 500 ? dto.Body[..500] : dto.Body,
                    Date = dto.ReceivedAt ?? DateTime.UtcNow,
                    Priorite = PrioriteIncident.MOYENNE,
                    Statut = StatutIncident.EnCours,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ClosedAt = null,
                    SocieteId = CurrentSocieteId.Value
                };

                await _context.Incidents.AddAsync(incident);
                await _context.SaveChangesAsync();

                await NotifyCompanyUsersAsync(CurrentSocieteId.Value, new
                {
                    incidentId = incident.Id,
                    titre = incident.Titre,
                    priorite = "MOYENNE",
                    message = $"Nouvel incident cree par email : {incident.Titre}"
                });

                return Ok(new
                {
                    message = "Incident cree avec succes",
                    incidentId = incident.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'import d'email");
                return StatusCode(500, new { message = "Erreur interne", error = ex.Message });
            }
        }

        private async Task NotifyCompanyUsersAsync(int societeId, object payload)
        {
            var emails = await _context.Users
                .AsNoTracking()
                .Where(u => u.SocieteId == societeId && !string.IsNullOrWhiteSpace(u.Email))
                .Select(u => u.Email!)
                .ToListAsync();

            foreach (var email in emails)
            {
                await _hubContext.Clients
                    .Group(NormalizeEmailForGroup(email))
                    .SendAsync("ReceiveNotification", payload);
            }
        }

        private static string NormalizeEmailForGroup(string email)
        {
            return email.ToLowerInvariant()
                .Replace("@", "_")
                .Replace(".", "_");
        }
    }
}
