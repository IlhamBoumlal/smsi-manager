using System.Security.Claims;
using backend.Application.DTOs.Risques;
using backend.Application.Risques.Commands.CreateRiskStudy;
using backend.Application.Risques.Commands.DeleteRiskStudy;
using backend.Application.Risques.Commands.DuplicateRiskStudy;
using backend.Application.Risques.Commands.UpdateRiskStudy;
using backend.Application.Risques.Queries.GetAllRiskStudies;
using backend.Application.Risques.Queries.GetRiskStudyById;
using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/risques/studies")]
    public class RisquesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUserRepository _userRepository;

        public RisquesController(IMediator mediator, IUserRepository userRepository)
        {
            _mediator = mediator;
            _userRepository = userRepository;
        }

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
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var studies = await _mediator.Send(new GetAllRiskStudiesQuery(search, CurrentUserId, CurrentSocieteId));
            return Ok(studies);
        }

        [HttpGet("owners")]
        public async Task<IActionResult> GetOwners()
        {
            if (string.IsNullOrWhiteSpace(CurrentUserId) || !CurrentSocieteId.HasValue)
                return Forbid();

            var users = await _userRepository.GetActiveBySocieteAsync(CurrentSocieteId.Value);
            var data = users
                .Select(u => new RiskOwnerDto(
                    u.Id,
                    u.NomComplet ?? string.Empty,
                    u.Email ?? string.Empty))
                .ToList();

            return Ok(data);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var (success, error, data) = await _mediator.Send(new GetRiskStudyByIdQuery(id, CurrentUserId, CurrentSocieteId));
            if (success && data is not null) return Ok(data);
            if (IsForbiddenError(error)) return Forbid();
            return NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRiskStudyDto dto)
        {
            var (success, error, data) = await _mediator.Send(new CreateRiskStudyCommand(
                dto.Name,
                dto.Organization,
                dto.Description,
                dto.Perimeter,
                dto.Author,
                dto.PayloadJson,
                CurrentUserId,
                CurrentSocieteId));

            if (success && data is not null)
                return CreatedAtAction(nameof(GetById), new { id = data.Id }, data);

            if (IsForbiddenError(error)) return Forbid();
            return BadRequest(error);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRiskStudyDto dto)
        {
            var (success, error, data) = await _mediator.Send(new UpdateRiskStudyCommand(
                id,
                dto.Name,
                dto.Organization,
                dto.Description,
                dto.Perimeter,
                dto.Author,
                dto.PayloadJson,
                CurrentUserId,
                CurrentSocieteId));

            if (success && data is not null) return Ok(data);
            if (IsForbiddenError(error)) return Forbid();
            if (IsNotFoundError(error)) return NotFound();
            return BadRequest(error);
        }

        [HttpPost("{id:guid}/duplicate")]
        public async Task<IActionResult> Duplicate(Guid id)
        {
            var (success, error, data) = await _mediator.Send(new DuplicateRiskStudyCommand(
                id,
                CurrentUserId,
                CurrentSocieteId));

            if (success && data is not null)
                return CreatedAtAction(nameof(GetById), new { id = data.Id }, data);

            if (IsForbiddenError(error)) return Forbid();
            if (IsNotFoundError(error)) return NotFound();
            return BadRequest(error);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var (success, error) = await _mediator.Send(new DeleteRiskStudyCommand(
                id,
                CurrentUserId,
                CurrentSocieteId));

            if (success) return NoContent();
            if (IsForbiddenError(error)) return Forbid();
            if (IsNotFoundError(error)) return NotFound();
            return BadRequest(error);
        }

        private static bool IsForbiddenError(string? error)
            => error?.StartsWith("FORBIDDEN", StringComparison.OrdinalIgnoreCase) == true;

        private static bool IsNotFoundError(string? error)
            => error?.StartsWith("NOT_FOUND", StringComparison.OrdinalIgnoreCase) == true;
    }
}
