using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly UserManager<IdentityUser> _userManager;

        // ✅ Un seul constructeur avec les 2 services
        public AuthController(AuthService authService, UserManager<IdentityUser> userManager)
        {
            _authService = authService;
            _userManager = userManager;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var (success, error, data) = await _authService.Register(dto);
            if (!success) return BadRequest(error);
            return Ok(data);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var (success, error, data) = await _authService.Login(dto);
            if (!success) return Unauthorized(error);
            return Ok(data);
        }

        [HttpGet("holdings")]
        public async Task<IActionResult> GetHoldings()
            => Ok(await _authService.GetHoldings());

        [HttpGet("societes")]
        public async Task<IActionResult> GetSocietes([FromQuery] int? holdingId)
            => Ok(await _authService.GetSocietes(holdingId));

        [Authorize]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound("Utilisateur introuvable.");

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest("Erreur lors de la suppression.");

            return Ok("Utilisateur supprimé avec succès.");
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetMe()
        {
            return Ok(new
            {
                id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                email = User.FindFirst(ClaimTypes.Email)?.Value,
                nomComplet = User.FindFirst("NomComplet")?.Value,
                societeId = User.FindFirst("SocieteId")?.Value
            });
        }
    }
}