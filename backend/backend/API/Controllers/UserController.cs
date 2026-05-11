using backend.Application.Auth.Commands.Register;
using backend.Application.DTOs.User;
using backend.Application.Roles.Queries.GetAllRoles;
using backend.Application.Security;
using backend.Application.Users.Commands.DeleteUser;
using backend.Application.Users.Commands.UpdateUser;
using backend.Application.Users.Queries.GetAllUsers;
using backend.Application.Users.Queries.GetUserPermissions;
using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private const string UserManagementRoles = "Super Admin,Admin Societe,Admin";

        private readonly IMediator _mediator;
        private readonly IUserRepository _userRepository;

        public UserController(IMediator mediator, IUserRepository userRepository)
        {
            _mediator = mediator;
            _userRepository = userRepository;
        }

        private string CurrentUserId =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private int? CurrentSocieteId
        {
            get
            {
                var value = User.FindFirstValue("SocieteId");
                return int.TryParse(value, out var parsed) ? parsed : null;
            }
        }

        private IReadOnlyCollection<string> CurrentRoles =>
            User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();

        private bool IsSuperAdmin => CurrentRoles.Any(AppRoles.IsSuperAdminRole);

        private bool IsAdminSociete =>
            CurrentRoles.Any(r =>
                string.Equals(
                    AppRoles.NormalizeKey(r),
                    AppRoles.NormalizeKey(AppRoles.AdminSociete),
                    StringComparison.OrdinalIgnoreCase));

        // Nouveau : rôle "Admin" simple (limité à sa société)
        private bool IsAdmin =>
            CurrentRoles.Any(r =>
                string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));

        // Regroupe Admin Societe et Admin (même comportement scoped)
        private bool IsScopedAdmin => IsAdminSociete || IsAdmin;

        [HttpGet]
        [Authorize(Roles = UserManagementRoles)]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _mediator.Send(new GetAllUsersQuery());

            if (IsSuperAdmin)
            {
                return Ok(users);
            }

            if (!IsScopedAdmin || !CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var scopedUsers = users
                .Where(u => u.SocieteId == CurrentSocieteId.Value)
                .Where(u => !AppRoles.IsSuperAdminRole(u.Role))
                .ToList();

            return Ok(scopedUsers);
        }

        [HttpPost]
        [Authorize(Roles = UserManagementRoles)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (IsScopedAdmin)
            {
                if (!CurrentSocieteId.HasValue)
                {
                    return Forbid();
                }

                if (dto.SocieteId != CurrentSocieteId.Value)
                {
                    return BadRequest("Un Admin ne peut creer des utilisateurs que dans sa societe.");
                }

                var roleName = await ResolveRoleNameAsync(dto.RoleId);
                if (roleName is null)
                {
                    return BadRequest("Role introuvable.");
                }

                if (AppRoles.IsSuperAdminRole(roleName))
                {
                    return Forbid();
                }
            }

            var (success, error, _) = await _mediator.Send(new RegisterCommand(
                dto.NomComplet,
                dto.Email,
                dto.Password,
                dto.ConfirmPassword,
                dto.SocieteId,
                dto.RoleId));

            return success ? Ok("Utilisateur cree avec succes.") : BadRequest(error);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = UserManagementRoles)]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
        {
            if (IsScopedAdmin)
            {
                if (!CurrentSocieteId.HasValue)
                {
                    return Forbid();
                }

                var targetUser = await _userRepository.GetByIdAsync(id);
                if (targetUser is null)
                {
                    return NotFound("Utilisateur introuvable.");
                }

                if (targetUser.SocieteId != CurrentSocieteId.Value)
                {
                    return Forbid();
                }

                var targetRoles = await _userRepository.GetRolesAsync(targetUser);
                if (targetRoles.Any(AppRoles.IsSuperAdminRole))
                {
                    return Forbid();
                }

                if (dto.SocieteId != CurrentSocieteId.Value)
                {
                    return BadRequest("Un Admin ne peut affecter l'utilisateur qu'a sa societe.");
                }

                var roleName = await ResolveRoleNameAsync(dto.RoleId);
                if (roleName is null)
                {
                    return BadRequest("Role introuvable.");
                }

                if (AppRoles.IsSuperAdminRole(roleName))
                {
                    return Forbid();
                }
            }

            var (success, error) = await _mediator.Send(new UpdateUserCommand(
                id,
                dto.NomComplet,
                dto.Email,
                dto.SocieteId,
                dto.RoleId,
                dto.Password,
                dto.ConfirmPassword,
                dto.IsActive));

            return success ? Ok("Utilisateur mis a jour avec succes.") : BadRequest(error);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = UserManagementRoles)]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (IsScopedAdmin)
            {
                if (!CurrentSocieteId.HasValue)
                {
                    return Forbid();
                }

                var targetUser = await _userRepository.GetByIdAsync(id);
                if (targetUser is null)
                {
                    return NotFound("Utilisateur introuvable.");
                }

                if (targetUser.SocieteId != CurrentSocieteId.Value)
                {
                    return Forbid();
                }

                var targetRoles = await _userRepository.GetRolesAsync(targetUser);
                if (targetRoles.Any(AppRoles.IsSuperAdminRole))
                {
                    return Forbid();
                }

                if (string.Equals(targetUser.Id, CurrentUserId, StringComparison.Ordinal))
                {
                    return BadRequest("Impossible de supprimer votre propre compte.");
                }
            }

            var (success, error) = await _mediator.Send(new DeleteUserCommand(id));
            return success ? Ok("Utilisateur supprime avec succes.") : BadRequest(error);
        }

        [HttpGet("roles")]
        [Authorize(Roles = UserManagementRoles)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());

            if (IsSuperAdmin)
            {
                return Ok(roles.Select(r => new { id = r.Id, nom = r.Name }));
            }

            if (!IsScopedAdmin)
            {
                return Forbid();
            }

            var allowedRoles = roles
                .Where(r => !AppRoles.IsSuperAdminRole(r.Name))
                .Select(r => new { id = r.Id, nom = r.Name });

            return Ok(allowedRoles);
        }

        [HttpGet("me/permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Utilisateur non authentifie" });
            }

            var result = await _mediator.Send(new GetUserPermissionsQuery { UserId = userId });
            return Ok(result);
        }

        private async Task<string?> ResolveRoleNameAsync(string roleId)
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            return roles.FirstOrDefault(r => string.Equals(r.Id, roleId, StringComparison.Ordinal))?.Name;
        }
    }
}