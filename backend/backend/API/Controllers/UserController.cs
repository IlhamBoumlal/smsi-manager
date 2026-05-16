using backend.Application.Auth.Commands.Register;
using backend.Application.DTOs.User;
using backend.Application.Roles.Queries.GetAllRoles;
using backend.Application.Security;
using backend.Application.Users.Commands.DeleteUser;
using backend.Application.Users.Commands.UpdateUser;
using backend.Application.Users.Queries.GetAllUsers;
using backend.Application.Users.Queries.GetUserPermissions;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private static readonly HashSet<string> TenantManagedRoleKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            AppRoles.NormalizeKey(AppRoles.Rssi),
            AppRoles.NormalizeKey(AppRoles.Consultant),
            AppRoles.NormalizeKey(AppRoles.Auditeur)
        };
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> PermissionOverrideLocks = new(StringComparer.OrdinalIgnoreCase);

        private readonly IMediator _mediator;
        private readonly IUserRepository _userRepository;
        private readonly IUserPermissionService _permissionService;
        private readonly AppDbContext _dbContext;

        public UserController(
            IMediator mediator,
            IUserRepository userRepository,
            IUserPermissionService permissionService,
            AppDbContext dbContext)
        {
            _mediator = mediator;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _dbContext = dbContext;
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

        [HttpGet]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("users", "read")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _mediator.Send(new GetAllUsersQuery());

            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var scopedUsers = users
                .Where(u => u.SocieteId == CurrentSocieteId.Value)
                .Where(u => !AppRoles.IsSuperAdminRole(u.Role))
                .Select(u => u with { Role = AppRoles.ToDisplayRoleName(u.Role) })
                .ToList();

            return Ok(scopedUsers);
        }

        [HttpGet("platform/admin-societe")]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("users", "read")]
        public async Task<IActionResult> GetAdminSocieteUsers()
        {
            var users = await _mediator.Send(new GetAllUsersQuery());
            var adminSocieteUsers = users
                .Where(u => IsAdminSocieteRole(u.Role))
                .Select(u => u with { Role = AppRoles.ToDisplayRoleName(u.Role) })
                .ToList();

            return Ok(adminSocieteUsers);
        }

        [HttpPost("platform/admin-societe")]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("users", "create")]
        public async Task<IActionResult> CreateAdminSociete([FromBody] CreateAdminSocieteDto dto)
        {
            if (dto.SocieteId <= 0)
            {
                return BadRequest("Societe requise.");
            }

            var adminSocieteRoleId = await ResolveAdminSocieteRoleIdAsync();
            if (adminSocieteRoleId is null)
            {
                return BadRequest("Role Admin Societe introuvable.");
            }

            var (success, error, _) = await _mediator.Send(new RegisterCommand(
                dto.NomComplet,
                dto.Email,
                dto.Password,
                dto.ConfirmPassword,
                dto.SocieteId,
                adminSocieteRoleId));

            return success ? Ok("Admin Societe cree avec succes.") : BadRequest(error);
        }

        [HttpPut("platform/admin-societe/{id}")]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("users", "edit")]
        public async Task<IActionResult> UpdateAdminSociete(string id, [FromBody] UpdateAdminSocieteDto dto)
        {
            if (dto.SocieteId <= 0)
            {
                return BadRequest("Societe requise.");
            }

            var targetUser = await _userRepository.GetByIdAsync(id);
            if (targetUser is null)
            {
                return NotFound("Utilisateur introuvable.");
            }

            var targetRoles = await _userRepository.GetRolesAsync(targetUser);
            if (!targetRoles.Any(IsAdminSocieteRole))
            {
                return Forbid("Cet utilisateur n'est pas un Admin Societe.");
            }

            var adminSocieteRoleId = await ResolveAdminSocieteRoleIdAsync();
            if (adminSocieteRoleId is null)
            {
                return BadRequest("Role Admin Societe introuvable.");
            }

            var (success, error) = await _mediator.Send(new UpdateUserCommand(
                id,
                dto.NomComplet,
                dto.Email,
                dto.SocieteId,
                adminSocieteRoleId,
                dto.Password,
                dto.ConfirmPassword,
                dto.IsActive));

            return success ? Ok("Admin Societe mis a jour avec succes.") : BadRequest(error);
        }

        [HttpDelete("platform/admin-societe/{id}")]
        [Authorize(Policy = "PlatformScope")]
        [RequirePermission("users", "delete")]
        public async Task<IActionResult> DeleteAdminSociete(string id)
        {
            var targetUser = await _userRepository.GetByIdAsync(id);
            if (targetUser is null)
            {
                return NotFound("Utilisateur introuvable.");
            }

            var targetRoles = await _userRepository.GetRolesAsync(targetUser);
            if (!targetRoles.Any(IsAdminSocieteRole))
            {
                return Forbid("Cet utilisateur n'est pas un Admin Societe.");
            }

            var (success, error) = await _mediator.Send(new DeleteUserCommand(id));
            return success ? Ok("Admin Societe supprime avec succes.") : BadRequest(error);
        }

        [HttpPost]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("users", "create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            if (dto.SocieteId != CurrentSocieteId.Value)
            {
                return BadRequest("Un Admin Societe ne peut creer des utilisateurs que dans sa societe.");
            }

            var roleName = await ResolveRoleNameAsync(dto.RoleId);
            if (roleName is null)
            {
                return BadRequest("Role introuvable.");
            }

            if (!IsTenantManagedRoleForCurrentSociete(roleName))
            {
                return Forbid("Role non autorise pour votre societe.");
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
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("users", "edit")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
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

            if (!targetRoles.Any(IsTenantManagedRoleForCurrentSociete))
            {
                return Forbid("Cet utilisateur n'est pas modifiable par un Admin Societe.");
            }

            if (dto.SocieteId != CurrentSocieteId.Value)
            {
                return BadRequest("Un Admin Societe ne peut affecter l'utilisateur qu'a sa societe.");
            }

            var roleName = await ResolveRoleNameAsync(dto.RoleId);
            if (roleName is null)
            {
                return BadRequest("Role introuvable.");
            }

            if (!IsTenantManagedRoleForCurrentSociete(roleName))
            {
                return Forbid("Role non autorise pour votre societe.");
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
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("users", "delete")]
        public async Task<IActionResult> DeleteUser(string id)
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

            if (!targetRoles.Any(IsTenantManagedRoleForCurrentSociete))
            {
                return Forbid("Cet utilisateur n'est pas supprimable par un Admin Societe.");
            }

            if (string.Equals(targetUser.Id, CurrentUserId, StringComparison.Ordinal))
            {
                return BadRequest("Impossible de supprimer votre propre compte.");
            }

            var (success, error) = await _mediator.Send(new DeleteUserCommand(id));
            return success ? Ok("Utilisateur supprime avec succes.") : BadRequest(error);
        }

        [HttpGet("roles")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "read")]
        public async Task<IActionResult> GetRoles()
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var roles = await _dbContext.Roles
                .AsNoTracking()
                .ToListAsync();

            var allowedRoles = roles
                .Where(r => IsRoleVisibleForCurrentSociete(r.Name))
                .Select(r => new
                {
                    id = r.Id,
                    nom = AppRoles.ToDisplayRoleName(r.Name),
                    isSystem = IsTenantBaseRole(r.Name),
                    isCustom = AppRoles.IsTenantCustomRoleName(r.Name),
                })
                .OrderBy(r => r.nom)
                .ToList();

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

        [HttpGet("{id}/permissions/effective")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "read")]
        public async Task<IActionResult> GetUserEffectivePermissions(string id, CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var targetUser = await _userRepository.GetByIdAsync(id, cancellationToken);
            if (targetUser is null)
            {
                return NotFound("Utilisateur introuvable.");
            }

            if (targetUser.SocieteId != CurrentSocieteId.Value)
            {
                return Forbid();
            }

            var permissions = await _permissionService.GetEffectivePermissionsAsync(targetUser.Id, cancellationToken);
            return Ok(permissions);
        }

        [HttpPut("{id}/permissions/overrides")]
        [Authorize(Policy = "TenantAdminScope")]
        [RequirePermission("roles", "edit")]
        public async Task<IActionResult> SetUserPermissionOverrides(
            string id,
            [FromBody] SetUserPermissionOverridesDto dto,
            CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            if (string.Equals(id, CurrentUserId, StringComparison.Ordinal))
            {
                return BadRequest("Impossible de modifier vos propres permissions.");
            }

            if (dto is null)
            {
                return BadRequest("Payload d'overrides invalide.");
            }

            var targetUser = await _userRepository.GetByIdAsync(id, cancellationToken);
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

            if (!targetRoles.Any(IsTenantManagedRoleForCurrentSociete))
            {
                return Forbid("Les overrides de permissions sont limites aux roles geres dans votre societe.");
            }

            var targetIsRssi = targetRoles.Any(role =>
                string.Equals(AppRoles.NormalizeKey(role), AppRoles.NormalizeKey(AppRoles.Rssi), StringComparison.OrdinalIgnoreCase));

            var requestedOverrides = dto.Overrides ?? new List<UserPermissionOverrideItemDto>();

            var modules = await _dbContext.Modules
                .AsNoTracking()
                .ToListAsync(cancellationToken);
            var actions = await _dbContext.Actions
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var maxExpectedOverrides = modules.Count * actions.Count;
            if (maxExpectedOverrides > 0 && requestedOverrides.Count > maxExpectedOverrides)
            {
                return BadRequest("Nombre d'overrides invalide.");
            }

            var moduleIdByCanonicalCode = modules.ToDictionary(
                m => PermissionCatalog.CanonicalizeModule(m.Code),
                m => m.Id,
                StringComparer.OrdinalIgnoreCase);
            var actionIdByCanonicalCode = actions.ToDictionary(
                a => PermissionCatalog.Actions.Canonicalize(a.Code),
                a => a.Id,
                StringComparer.OrdinalIgnoreCase);

            var desiredRows = new Dictionary<(string ModuleId, string ActionId), backend.Domain.Entities.UserPermissionOverride>();

            foreach (var overrideItem in requestedOverrides)
            {
                if (overrideItem is null)
                {
                    return BadRequest("Override invalide.");
                }

                var moduleCode = PermissionCatalog.CanonicalizeModule(overrideItem.ModuleCode);
                var actionCode = PermissionCatalog.Actions.Canonicalize(overrideItem.ActionCode);

                if (string.IsNullOrWhiteSpace(moduleCode) || string.IsNullOrWhiteSpace(actionCode))
                {
                    return BadRequest("Module/action invalide dans les overrides.");
                }

                if (!PermissionCatalog.IsSmsiModule(moduleCode)
                    && !string.Equals(moduleCode, "users", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(moduleCode, "roles", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest($"Module non autorise pour override: {moduleCode}");
                }

                if (!targetIsRssi
                    && string.Equals(moduleCode, "documentation", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(actionCode, PermissionCatalog.Actions.Approve, StringComparison.OrdinalIgnoreCase)
                    && overrideItem.IsGranted)
                {
                    return BadRequest("Seul le role RSSI peut recevoir la permission d'approbation documentaire.");
                }

                if (!moduleIdByCanonicalCode.TryGetValue(moduleCode, out var moduleId))
                {
                    return BadRequest($"Module inconnu: {overrideItem.ModuleCode}");
                }

                if (!actionIdByCanonicalCode.TryGetValue(actionCode, out var actionId))
                {
                    return BadRequest($"Action inconnue: {overrideItem.ActionCode}");
                }

                var trimmedReason = string.IsNullOrWhiteSpace(overrideItem.Reason)
                    ? null
                    : overrideItem.Reason.Trim();

                if (trimmedReason?.Length > 500)
                {
                    trimmedReason = trimmedReason[..500];
                }

                var key = (moduleId, actionId);
                desiredRows[key] = new backend.Domain.Entities.UserPermissionOverride
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = targetUser.Id,
                    SocieteId = CurrentSocieteId.Value,
                    ModuleId = moduleId,
                    ActionId = actionId,
                    IsGranted = overrideItem.IsGranted,
                    Reason = trimmedReason,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
            }

            // Plusieurs actions UI peuvent déclencher des requêtes quasi simultanées.
            // On remplace le jeu d'overrides dans une transaction et on tente un court retry.
            var lockKey = $"{CurrentSocieteId.Value}:{targetUser.Id}";
            var syncLock = PermissionOverrideLocks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
            await syncLock.WaitAsync(cancellationToken);

            try
            {
                const int maxAttempts = 3;
                for (var attempt = 1; attempt <= maxAttempts; attempt++)
                {
                    try
                    {
                        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();
                        await executionStrategy.ExecuteAsync(async () =>
                        {
                    _dbContext.ChangeTracker.Clear();

                    await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

                    await _dbContext.UserPermissionOverrides
                        .Where(o => o.UserId == targetUser.Id && o.SocieteId == CurrentSocieteId.Value)
                        .ExecuteDeleteAsync(cancellationToken);

                    if (desiredRows.Count > 0)
                    {
                        // On recrée des entités neuves à chaque tentative.
                        var rowsToInsert = desiredRows.Values.Select(row => new backend.Domain.Entities.UserPermissionOverride
                        {
                            Id = Guid.NewGuid().ToString(),
                            UserId = row.UserId,
                            SocieteId = row.SocieteId,
                            ModuleId = row.ModuleId,
                            ActionId = row.ActionId,
                            IsGranted = row.IsGranted,
                            Reason = row.Reason,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                        });

                        _dbContext.UserPermissionOverrides.AddRange(rowsToInsert);
                    }

                    await _dbContext.SaveChangesAsync(cancellationToken);
                    await tx.CommitAsync(cancellationToken);
                        });

                    var effectivePermissions = await _permissionService.GetEffectivePermissionsAsync(targetUser.Id, cancellationToken);
                    return Ok(effectivePermissions);
                }
                    catch (DbUpdateConcurrencyException) when (attempt < maxAttempts)
                    {
                        await Task.Delay(40 * attempt, cancellationToken);
                    }
                    catch (DbUpdateException ex) when (attempt < maxAttempts && (IsLikelyUniqueConstraint(ex) || IsLikelyDeadlock(ex)))
                    {
                        await Task.Delay(80 * attempt, cancellationToken);
                    }
                    catch (InvalidOperationException ex) when (attempt < maxAttempts && IsLikelyDeadlock(ex))
                    {
                        await Task.Delay(80 * attempt, cancellationToken);
                    }
                    catch (SqlException ex) when (attempt < maxAttempts && IsLikelyDeadlock(ex))
                    {
                        await Task.Delay(80 * attempt, cancellationToken);
                    }
                }

                return Conflict("Conflit transitoire detecte (verrou SQL). Veuillez reessayer.");
            }
            finally
            {
                syncLock.Release();
            }
        }

        private async Task<string?> ResolveRoleNameAsync(string roleId)
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            return roles.FirstOrDefault(r => string.Equals(r.Id, roleId, StringComparison.Ordinal))?.Name;
        }

        private async Task<string?> ResolveAdminSocieteRoleIdAsync()
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            return roles
                .FirstOrDefault(r => string.Equals(
                    AppRoles.NormalizeKey(r.Name),
                    AppRoles.NormalizeKey(AppRoles.AdminSociete),
                    StringComparison.OrdinalIgnoreCase))
                ?.Id;
        }

        private bool IsTenantManagedRoleForCurrentSociete(string? roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return false;
            }

            if (IsTenantBaseRole(roleName))
            {
                return true;
            }

            if (!CurrentSocieteId.HasValue)
            {
                return false;
            }

            return AppRoles.IsTenantCustomRoleOwnedBy(roleName, CurrentSocieteId.Value);
        }

        private bool IsRoleVisibleForCurrentSociete(string? roleName)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return false;
            }

            if (IsTenantBaseRole(roleName))
            {
                return true;
            }

            return AppRoles.IsTenantCustomRoleOwnedBy(roleName, CurrentSocieteId.Value);
        }

        private static bool IsTenantBaseRole(string? roleName)
            => TenantManagedRoleKeys.Contains(AppRoles.NormalizeKey(roleName));

        private static bool IsAdminSocieteRole(string? roleName)
            => string.Equals(
                AppRoles.NormalizeKey(roleName),
                AppRoles.NormalizeKey(AppRoles.AdminSociete),
                StringComparison.OrdinalIgnoreCase);

        private static bool IsLikelyUniqueConstraint(DbUpdateException ex)
        {
            var message = $"{ex.Message} {ex.InnerException?.Message}";
            return message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase)
                || message.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
                || message.Contains("2627", StringComparison.OrdinalIgnoreCase)
                || message.Contains("2601", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsLikelyDeadlock(Exception ex)
        {
            if (ex is SqlException sqlEx)
            {
                return sqlEx.Number == 1205;
            }

            var message = ex.Message ?? string.Empty;
            if (message.Contains("deadlock", StringComparison.OrdinalIgnoreCase)
                || message.Contains("1205", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return ex.InnerException is not null && IsLikelyDeadlock(ex.InnerException);
        }
    }
}
