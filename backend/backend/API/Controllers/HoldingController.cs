using backend.Application.DTOs;
using backend.Application.DTOs.Holding;
using backend.Application.Holdings.Commands.CreateHolding;
using backend.Application.Holdings.Commands.DeleteHolding;
using backend.Application.Holdings.Commands.UpdateHolding;
using backend.Application.Holdings.Queries.GetAllHoldings;
using backend.Application.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [Authorize(Roles = AppRoles.SuperAdmin)]
    [ApiController]
    [Route("api/[controller]")]
    public class HoldingController : ControllerBase
    {
        private readonly IMediator _mediator;
        public HoldingController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetHoldings() =>
            Ok(await _mediator.Send(new GetAllHoldingsQuery()));

        [HttpPost]
        public async Task<IActionResult> CreateHolding(CreateHoldingCommand command)
        {
            var (success, error) = await _mediator.Send(command);
            return success ? Ok("Holding créée avec succès.") : BadRequest(error);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHolding(int id, UpdateHoldingDto dto)
        {
            var (success, error) = await _mediator.Send(new UpdateHoldingCommand(id, dto.Nom));
            return success ? Ok("Holding mise à jour avec succès.") : BadRequest(error);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHolding(int id)
        {
            var (success, error) = await _mediator.Send(new DeleteHoldingCommand(id));
            return success ? Ok("Holding supprimée avec succès.") : BadRequest(error);
        }
    }
}
