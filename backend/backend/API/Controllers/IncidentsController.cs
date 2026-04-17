using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncidentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public IncidentsController(IMediator mediator) => _mediator = mediator;

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(IncidentDto dto)
        {
            // Le client ne doit pas fournir d'Id ni de Date
            
            var id = await _mediator.Send(new CreateIncidentCommand(dto));
            return Ok(id);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, IncidentDto dto)
        {
            // 👇 Ajoute ça temporairement
            Console.WriteLine($"=== UPDATE REÇU ===");
            Console.WriteLine($"Statut: {dto.Statut}");
            Console.WriteLine($"Resolution: {dto.Resolution}");
            Console.WriteLine($"Priorite: {dto.Priorite}");
            Console.WriteLine($"===================");

            var result = await _mediator.Send(new UpdateIncidentCommand(id, dto));
            return result ? Ok() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _mediator.Send(new DeleteIncidentCommand(id));
            return result ? Ok() : NotFound();
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidentDto>>> GetAll()
        {
            var incidents = await _mediator.Send(new GetAllIncidentsQuery());
            return Ok(incidents);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IncidentDto>> GetById(Guid id)
        {
            var incident = await _mediator.Send(new GetIncidentByIdQuery(id));
            return incident == null ? NotFound() : Ok(incident);
        }
    }
}
