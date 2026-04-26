using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class IncidentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<IncidentsController> _logger;

        public IncidentsController(IMediator mediator, ILogger<IncidentsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
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
                // On continue quand même (incident global) — retirez ce commentaire
                // et décommentez la ligne suivante si vous voulez bloquer :
                // return Unauthorized("SocieteId manquant dans le token.");
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
    }
}