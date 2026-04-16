using backend.Application.Auth.Commands.Register;
using backend.Application.DTOs;
using backend.Application.DTOs.User;
using backend.Application.Roles.Queries.GetAllRoles;
using backend.Application.Services;
using backend.Application.Users.Commands.DeleteUser;
using backend.Application.Users.Commands.UpdateUser;
using backend.Application.Users.Queries.GetAllUsers;
using MediatR;
<<<<<<< HEAD
using Microsoft.AspNetCore.Authorization;
=======
>>>>>>> meriem
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
<<<<<<< HEAD
    [Authorize(Roles = "Admin")]
=======
>>>>>>> meriem
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IMediator _mediator;
        public UserController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetUsers() =>
            Ok(await _mediator.Send(new GetAllUsersQuery()));
        [HttpPost]
        public async Task<IActionResult> CreateUser(CreateUserDto dto)
        {
            var (success, error, _) = await _mediator.Send(new RegisterCommand(
                dto.NomComplet,
                dto.Email,
                dto.Password,
                dto.ConfirmPassword,
                dto.SocieteId,
                dto.RoleId));

            return success ? Ok("Utilisateur créé avec succès.") : BadRequest(error);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, UpdateUserDto dto)
        {
            var (success, error) = await _mediator.Send(new UpdateUserCommand(
                id, dto.NomComplet, dto.Email, dto.SocieteId,
                dto.RoleId, dto.Password, dto.ConfirmPassword, dto.IsActive));

            return success ? Ok("Utilisateur mis à jour avec succès.") : BadRequest(error);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var (success, error) = await _mediator.Send(new DeleteUserCommand(id));
            return success ? Ok("Utilisateur supprimé avec succès.") : BadRequest(error);
        }

        // ─── Roles (réutilise la Query déjà créée) ───────────────────────────
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            return Ok(roles.Select(r => new { id = r.Id, nom = r.Name }));
        }
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> meriem
