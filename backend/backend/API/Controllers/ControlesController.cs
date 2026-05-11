using backend.Application.Controles.Commands.UpdateControle;
using backend.Application.Controles.Queries.GetAllControles;
using backend.Application.Controles.Queries.GetControleById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers
{

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ControlesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ControlesController(IMediator mediator) => _mediator = mediator;

        private int? CurrentSocieteId => int.TryParse(User.FindFirstValue("SocieteId"), out var id) ? id : null;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _mediator.Send(new GetAllControlesQuery(CurrentSocieteId)));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetControleByIdQuery(id, CurrentSocieteId));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateControleCommand command)
        {
            var (success, error, data) = await _mediator.Send(command with { Id = id, SocieteId = CurrentSocieteId });
            return success ? Ok(data) : BadRequest(error);
        }
    }
}