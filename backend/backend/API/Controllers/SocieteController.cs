using backend.Application.DTOs.Societe;
using backend.Application.Services;
using backend.Application.Societes.Commands.CreateSociete;
using backend.Application.Societes.Commands.DeleteSociete;
using backend.Application.Societes.Commands.UpdateSociete;
using backend.Application.Societes.Queries.GetAllSocietes;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SocieteController : ControllerBase
    {
        private readonly IMediator _mediator;
        public SocieteController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? holdingId) =>
            Ok(await _mediator.Send(new GetAllSocietesQuery(holdingId)));

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateSocieteDto dto, IFormFile? logo)
        {
            var (success, error) = await _mediator.Send(
                new CreateSocieteCommand(dto.Nom, dto.HoldingId, logo));
            return success ? Ok("Société créée avec succès.") : BadRequest(error);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id,
                                          [FromForm] UpdateSocieteDto dto,
                                          IFormFile? logo)
        {
            var (success, error) = await _mediator.Send(
                new UpdateSocieteCommand(id, dto.Nom, dto.HoldingId, logo));
            return success ? Ok("Société mise à jour avec succès.") : BadRequest(error);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (success, error) = await _mediator.Send(new DeleteSocieteCommand(id));
            return success ? Ok("Société supprimée avec succès.") : BadRequest(error);
        }
    }
}