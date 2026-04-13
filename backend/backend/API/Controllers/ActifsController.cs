using backend.Application.Actifs.Commands.CreateActif;
using backend.Application.Actifs.Commands.DeleteActif;
using backend.Application.Actifs.Commands.UpdateActif;
using backend.Application.Actifs.Queries.GetActifById;
using backend.Application.Actifs.Queries.GetAllActifs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ActifsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ActifsController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _mediator.Send(new GetAllActifsQuery()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetActifByIdQuery(id));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateActifCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateActifCommand command)
        {
            var result = await _mediator.Send(command with { Id = id });
            return result is null ? NotFound() : Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _mediator.Send(new DeleteActifCommand(id));
            return deleted ? NoContent() : NotFound();
        }
    }
}
