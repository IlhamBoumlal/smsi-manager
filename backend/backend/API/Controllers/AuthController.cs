using backend.Application.Auth.Commands.Login;
using backend.Application.Auth.Commands.Register;
using backend.Application.Auth.Queries;
using backend.Application.DTOs.Authentification;
using backend.Application.Roles.Queries.GetAllRoles;
using backend.Application.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AuthController(IMediator mediator) => _mediator = mediator;

        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("users", "create")]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            var targetRole = roles.FirstOrDefault(r => string.Equals(r.Id, dto.RoleId, StringComparison.Ordinal));
            if (targetRole is null)
            {
                return BadRequest("Role introuvable.");
            }

            if (!string.Equals(targetRole.Name, AppRoles.AdminSociete, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Le Super Admin peut uniquement creer un Admin Societe via cet endpoint.");
            }

            var command = new RegisterCommand(
                dto.NomComplet, dto.Email, dto.Password,
                dto.ConfirmPassword, dto.SocieteId, dto.RoleId);

            var (success, error, data) = await _mediator.Send(command);
            return success ? Ok(data) : BadRequest(error);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var (success, error, data) = await _mediator.Send(new LoginCommand(dto.Email, dto.Password));
            return success ? Ok(data) : Unauthorized(error);
        }
        [Authorize]
        [HttpGet("check-status")]
        public async Task<IActionResult> CheckUserStatus()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _mediator.Send(new CheckUserStatusQuery(userId));
            return Ok(user);
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetMe() => Ok(new
        {
            id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            email = User.FindFirst(ClaimTypes.Email)?.Value,
            nomComplet = User.FindFirst("NomComplet")?.Value,
            societeId = User.FindFirst("SocieteId")?.Value
        });

    }
}
