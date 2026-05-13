using backend.Application.Roles.Commands.CreateRole;
using backend.Application.Roles.Commands.DeleteRole;
using backend.Application.Roles.Commands.UpdateRole;
using backend.Application.Roles.Queries.GetAllRoles;
using backend.Application.Security;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private static readonly HashSet<string> TenantBaseRoleKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            AppRoles.NormalizeKey(AppRoles.Rssi),
            AppRoles.NormalizeKey(AppRoles.Consultant),
            AppRoles.NormalizeKey(AppRoles.Auditeur),
        };

        private static readonly HashSet<string> ReservedRoleKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            AppRoles.NormalizeKey(AppRoles.SuperAdmin),
            AppRoles.NormalizeKey(AppRoles.AdminSociete),
            AppRoles.NormalizeKey(AppRoles.Rssi),
            AppRoles.NormalizeKey(AppRoles.Consultant),
            AppRoles.NormalizeKey(AppRoles.Auditeur),
        };

        private readonly IMediator _mediator;
        private readonly AppDbContext _dbContext;
        private readonly RoleManager<IdentityRole> _roleManager;

        public RoleController(
            IMediator mediator,
            AppDbContext dbContext,
            RoleManager<IdentityRole> roleManager)
        {
            _mediator = mediator;
            _dbContext = dbContext;
            _roleManager = roleManager;
        }

        private int? CurrentSocieteId
        {
            get
            {
                var value = User.FindFirstValue("SocieteId");
                return int.TryParse(value, out var parsed) ? parsed : null;
            }
        }

        [HttpGet]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("roles", "read")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            return Ok(roles.Select(r => new { id = r.Id, nom = r.Name }));
        }

        [HttpPost]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("roles", "create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "Role cree avec succes" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("roles", "edit")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleCommand command)
        {
            if (id != command.RoleId)
                return BadRequest(new { error = "L'ID dans l'URL ne correspond pas a l'ID du corps de la requete" });

            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "Role mis a jour avec succes" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("roles", "delete")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var command = new DeleteRoleCommand { RoleId = id };
            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "Role supprime avec succes" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpGet("tenant")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "read")]
        public async Task<IActionResult> GetTenantRoles(CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var societeId = CurrentSocieteId.Value;

            var roles = await _dbContext.Roles
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var tenantRoles = roles
                .Where(role => IsVisibleToTenant(role.Name, societeId))
                .ToList();

            var roleIds = tenantRoles.Select(role => role.Id).ToArray();
            var userCountByRoleId = await _dbContext.UserRoles
                .AsNoTracking()
                .Where(ur => roleIds.Contains(ur.RoleId))
                .Join(
                    _dbContext.Users.AsNoTracking().Where(u => u.SocieteId == societeId),
                    ur => ur.UserId,
                    u => u.Id,
                    (ur, _) => ur.RoleId)
                .GroupBy(roleId => roleId)
                .Select(group => new { roleId = group.Key, count = group.Count() })
                .ToDictionaryAsync(row => row.roleId, row => row.count, cancellationToken);

            var result = tenantRoles
                .Select(role => new
                {
                    id = role.Id,
                    nom = AppRoles.ToDisplayRoleName(role.Name),
                    isSystem = IsTenantBaseRole(role.Name),
                    isCustom = AppRoles.IsTenantCustomRoleName(role.Name),
                    userCount = userCountByRoleId.TryGetValue(role.Id, out var count) ? count : 0,
                })
                .OrderByDescending(role => role.isSystem)
                .ThenBy(role => role.nom)
                .ToList();

            return Ok(result);
        }

        [HttpPost("tenant")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "create")]
        public async Task<IActionResult> CreateTenantRole([FromBody] TenantRoleUpsertDto dto, CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var displayRoleName = SanitizeDisplayRoleName(dto?.Nom);
            if (displayRoleName is null)
            {
                return BadRequest("Nom de role invalide.");
            }

            if (IsReservedDisplayRoleName(displayRoleName))
            {
                return BadRequest("Ce nom de role est reserve.");
            }

            var societeId = CurrentSocieteId.Value;
            var roles = await _dbContext.Roles
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var duplicateExists = roles.Any(role =>
            {
                if (!AppRoles.IsTenantCustomRoleOwnedBy(role.Name, societeId))
                {
                    return false;
                }

                var existingDisplayName = AppRoles.ToDisplayRoleName(role.Name);
                return string.Equals(
                    AppRoles.NormalizeKey(existingDisplayName),
                    AppRoles.NormalizeKey(displayRoleName),
                    StringComparison.OrdinalIgnoreCase);
            });

            if (duplicateExists)
            {
                return Conflict("Un role avec ce nom existe deja dans votre societe.");
            }

            var internalRoleName = AppRoles.BuildTenantCustomRoleName(societeId, displayRoleName);
            var result = await _roleManager.CreateAsync(new IdentityRole(internalRoleName));
            if (!result.Succeeded)
            {
                return BadRequest(new { errors = result.Errors.Select(error => error.Description) });
            }

            var createdRole = await _roleManager.FindByNameAsync(internalRoleName);
            return Ok(new
            {
                id = createdRole?.Id,
                nom = displayRoleName,
                isSystem = false,
                isCustom = true,
                userCount = 0,
            });
        }

        [HttpPut("tenant/{id}")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "edit")]
        public async Task<IActionResult> UpdateTenantRole(string id, [FromBody] TenantRoleUpsertDto dto, CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var displayRoleName = SanitizeDisplayRoleName(dto?.Nom);
            if (displayRoleName is null)
            {
                return BadRequest("Nom de role invalide.");
            }

            if (IsReservedDisplayRoleName(displayRoleName))
            {
                return BadRequest("Ce nom de role est reserve.");
            }

            var role = await _roleManager.FindByIdAsync(id);
            if (role is null)
            {
                return NotFound("Role introuvable.");
            }

            var societeId = CurrentSocieteId.Value;
            if (!AppRoles.IsTenantCustomRoleOwnedBy(role.Name, societeId))
            {
                return Forbid("Seuls les roles personnalises de votre societe sont modifiables.");
            }

            var roles = await _dbContext.Roles
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var duplicateExists = roles.Any(otherRole =>
            {
                if (string.Equals(otherRole.Id, role.Id, StringComparison.Ordinal))
                {
                    return false;
                }

                if (!AppRoles.IsTenantCustomRoleOwnedBy(otherRole.Name, societeId))
                {
                    return false;
                }

                var existingDisplayName = AppRoles.ToDisplayRoleName(otherRole.Name);
                return string.Equals(
                    AppRoles.NormalizeKey(existingDisplayName),
                    AppRoles.NormalizeKey(displayRoleName),
                    StringComparison.OrdinalIgnoreCase);
            });

            if (duplicateExists)
            {
                return Conflict("Un role avec ce nom existe deja dans votre societe.");
            }

            role.Name = AppRoles.BuildTenantCustomRoleName(societeId, displayRoleName);
            role.NormalizedName = role.Name.ToUpperInvariant();

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
            {
                return BadRequest(new { errors = result.Errors.Select(error => error.Description) });
            }

            return Ok(new
            {
                id = role.Id,
                nom = displayRoleName,
                isSystem = false,
                isCustom = true,
            });
        }

        [HttpDelete("tenant/{id}")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "delete")]
        public async Task<IActionResult> DeleteTenantRole(string id, CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var role = await _roleManager.FindByIdAsync(id);
            if (role is null)
            {
                return NotFound("Role introuvable.");
            }

            var societeId = CurrentSocieteId.Value;
            if (!AppRoles.IsTenantCustomRoleOwnedBy(role.Name, societeId))
            {
                return Forbid("Seuls les roles personnalises de votre societe sont supprimables.");
            }

            var usersInRoleCount = await _dbContext.UserRoles
                .AsNoTracking()
                .Where(ur => ur.RoleId == role.Id)
                .Join(
                    _dbContext.Users.AsNoTracking().Where(u => u.SocieteId == societeId),
                    ur => ur.UserId,
                    user => user.Id,
                    (_, _) => 1)
                .CountAsync(cancellationToken);

            if (usersInRoleCount > 0)
            {
                return Conflict("Ce role est assigne a des utilisateurs. Reaffectez-les avant suppression.");
            }

            await _dbContext.Permissions
                .Where(permission => permission.RoleId == role.Id)
                .ExecuteDeleteAsync(cancellationToken);

            var result = await _roleManager.DeleteAsync(role);
            if (!result.Succeeded)
            {
                return BadRequest(new { errors = result.Errors.Select(error => error.Description) });
            }

            return Ok(new { message = "Role supprime avec succes." });
        }

        private static string? SanitizeDisplayRoleName(string? rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return null;
            }

            var trimmed = rawValue.Trim();
            if (trimmed.Length < 2 || trimmed.Length > 60)
            {
                return null;
            }

            if (trimmed.Contains("::", StringComparison.Ordinal))
            {
                return null;
            }

            if (trimmed.StartsWith("S", StringComparison.OrdinalIgnoreCase)
                && trimmed.Contains("TENANT_ROLE", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return trimmed;
        }

        private static bool IsVisibleToTenant(string? roleName, int societeId)
        {
            if (IsTenantBaseRole(roleName))
            {
                return true;
            }

            return AppRoles.IsTenantCustomRoleOwnedBy(roleName, societeId);
        }

        private static bool IsTenantBaseRole(string? roleName)
            => TenantBaseRoleKeys.Contains(AppRoles.NormalizeKey(roleName));

        private static bool IsReservedDisplayRoleName(string roleDisplayName)
            => ReservedRoleKeys.Contains(AppRoles.NormalizeKey(roleDisplayName));
    }

    public class TenantRoleUpsertDto
    {
        public string Nom { get; set; } = string.Empty;
    }
}
