using backend.Application.Controles.Commands.UpdateControle;
using backend.Application.Controles.Queries.GetAllControles;
using backend.Application.Controles.Queries.GetControleById;
using backend.Application.Controles.Queries.GetHistoriqueControle;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [Authorize(Policy = "SmSiSocieteScope")]
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

        [HttpGet("{id}/historique")]
        public async Task<IActionResult> GetHistorique(Guid id) =>
            Ok(await _mediator.Send(new GetHistoriqueControleQuery(id)));

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateControleCommand command)
        {
            var modifierId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;
            var modifierNom =
                User.FindFirstValue("NomComplet")
                ?? User.FindFirstValue("name")
                ?? User.FindFirstValue(ClaimTypes.Name)
                ?? User.Identity?.Name
                ?? modifierId;

            var (success, error, data) = await _mediator.Send(command with
            {
                Id = id,
                SocieteId = CurrentSocieteId,
                ModifierId = modifierId,
                ModifierNom = modifierNom
            });

            return success ? Ok(data) : BadRequest(error);
        }
    }
}
