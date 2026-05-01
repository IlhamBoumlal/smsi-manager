using backend.Application.Actifs.Commands.CreateActif;
using backend.Application.Actifs.Commands.DeleteActif;
using backend.Application.Actifs.Commands.UpdateActif;
using backend.Application.Actifs.Queries.GetActifById;
using backend.Application.Actifs.Queries.GetAllActifs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers
{

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ActifsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ActifsController(IMediator mediator) => _mediator = mediator;

        private string CurrentUserId =>
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        private int? CurrentSocieteId
        {
            get
            {
                var value = User.FindFirstValue("SocieteId");
                return int.TryParse(value, out var parsed) ? parsed : null;
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _mediator.Send(new GetAllActifsQuery(CurrentSocieteId)));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetActifByIdQuery(id, CurrentSocieteId));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateActifCommand command)
        {
            var commandWithSociete = command with { SocieteId = CurrentSocieteId };
            var result = await _mediator.Send(commandWithSociete);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateActifCommand command)
        {
            var commandWithSociete = command with { Id = id, SocieteId = CurrentSocieteId };
            var result = await _mediator.Send(commandWithSociete);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _mediator.Send(new DeleteActifCommand(id, CurrentSocieteId));
            return deleted ? NoContent() : NotFound();
        }
    }
}
