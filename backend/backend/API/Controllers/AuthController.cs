using backend.Application.Auth.Commands.Login;
using backend.Application.Auth.Commands.Register;
using backend.Application.DTOs.Authentification;
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

        [Authorize(Roles = AppRoles.AdminScopes)]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
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
