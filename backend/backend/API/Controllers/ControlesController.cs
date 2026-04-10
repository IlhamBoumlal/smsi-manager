using backend.Application.Controles.Commands.UpdateControle;
using backend.Application.Controles.Queries.GetAllControles;
using backend.Application.Controles.Queries.GetControleById;
using backend.Application.Controles.Queries.GetHistoriqueControle;
using backend.Application.DTOs;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ControlesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ControlesController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _mediator.Send(new GetAllControlesQuery()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetControleByIdQuery(id));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ControleDto>> Update(Guid id, [FromBody] UpdateControleCommand command)
        {
            if (id != command.Id)
                return BadRequest("ID mismatch");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentUserName = User.FindFirst("NomComplet")?.Value;

            var commandWithAudit = command with
            {
                ModifierId = currentUserId,
                ModifierNom = currentUserName
            };

            var result = await _mediator.Send(commandWithAudit);

            if (!result.Success)
                return BadRequest(new { error = result.Error });

            return Ok(result.Data);
        }
        // GET /api/controles/{id}/historique
        [HttpGet("{id:guid}/historique")]
        public async Task<IActionResult> GetHistorique(Guid id, CancellationToken ct)
        {
            var result = await _mediator.Send(new GetHistoriqueControleQuery(id), ct);
            return Ok(result);
        }
    }
}