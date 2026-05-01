using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class IncidentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public IncidentsController(IMediator mediator) => _mediator = mediator;

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(IncidentDto dto)
        {
            
            var id = await _mediator.Send(new CreateIncidentCommand(dto));
            return Ok(id);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, IncidentDto dto)
        {
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
