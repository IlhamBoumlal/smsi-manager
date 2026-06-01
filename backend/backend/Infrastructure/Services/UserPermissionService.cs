using backend.Application.DTOs.User;
using backend.Application.Security;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Services
{
    public class UserPermissionService : IUserPermissionService
    {
        private const string MandatoryDashboardModuleCode = "dashboard";
        private const string MandatoryDashboardActionCode = PermissionCatalog.Actions.Read;
        private readonly AppDbContext _db;

        public UserPermissionService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<UserPermissionsDto> GetEffectivePermissionsAsync(string userId, CancellationToken cancellationToken = default)
        {
            var context = await LoadUserContextAsync(userId, cancellationToken);
            if (context is null)
            {
                throw new InvalidOperationException("Utilisateur introuvable.");
            }

            var allModules = await _db.Modules
                .AsNoTracking()
                .OrderBy(m => m.Name)
                .ToListAsync(cancellationToken);

            var allActions = await _db.Actions
                .AsNoTracking()
                .OrderBy(a => a.Name)
                .ToListAsync(cancellationToken);

            var grants = await BuildGrantMapAsync(context, cancellationToken);

            var modules = allModules
                .Select(module => new ModulePermissionDto
                {
                    ModuleId = module.Id,
                    // Always return canonical RBAC codes so frontend guards stay consistent
                    // even if legacy DB values use aliases like "user"/"role".
                    ModuleCode = PermissionCatalog.CanonicalizeModule(module.Code),
                    ModuleName = module.Name,
                    Actions = allActions
                        .Where(action => grants.TryGetValue((module.Id, action.Id), out var isGranted) && isGranted)
                        .Select(action => new ActionPermissionDto
                        {
                            ActionId = action.Id,
                            ActionCode = PermissionCatalog.Actions.Canonicalize(action.Code),
                            ActionName = action.Name,
                        })
                        .ToList()
                })
                .Where(module => module.Actions.Count > 0)
                .ToList();

            return new UserPermissionsDto
            {
                UserId = context.UserId,
                RoleId = context.PrimaryRoleId,
                RoleName = context.PrimaryRoleName,
                Modules = modules
            };
        }

        public async Task<bool> HasPermissionAsync(
            string userId,
            int? societeId,
            string moduleCode,
            string actionCode,
            CancellationToken cancellationToken = default)
        {
            var context = await LoadUserContextAsync(userId, cancellationToken);
            if (context is null)
            {
                return false;
            }

            var requestedModule = PermissionCatalog.CanonicalizeModule(moduleCode);
            var requestedAction = PermissionCatalog.Actions.Canonicalize(actionCode);
            if (string.IsNullOrWhiteSpace(requestedModule) || string.IsNullOrWhiteSpace(requestedAction))
            {
                return false;
            }

            if (string.Equals(requestedModule, MandatoryDashboardModuleCode, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(requestedAction, MandatoryDashboardActionCode, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (PermissionCatalog.IsPlatformModule(requestedModule)
                && !AppRoles.IsSuperAdminRoleKey(context.PrimaryRoleKey))
            {
                return false;
            }

            if (PermissionCatalog.IsSmsiModule(requestedModule)
                && AppRoles.IsSuperAdminRoleKey(context.PrimaryRoleKey))
            {
                return false;
            }

            if (PermissionCatalog.IsSmsiModule(requestedModule))
            {
                if (!context.UserSocieteId.HasValue || context.UserSocieteId.Value <= 0)
                {
                    return false;
                }

                if (!societeId.HasValue || societeId.Value <= 0)
                {
                    return false;
                }

                if (context.UserSocieteId.Value != societeId.Value)
                {
                    return false;
                }
            }

            var grantedPairs = await BuildGrantedPairKeysAsync(context, cancellationToken);
            var requestedPair = $"{requestedModule}::{requestedAction}";
            if (grantedPairs.Contains(requestedPair))
            {
                return true;
            }

            return grantedPairs.Contains($"{requestedModule}::{PermissionCatalog.Actions.Administer}");
        }

        private async Task<HashSet<string>> BuildGrantedPairKeysAsync(UserPermissionContext context, CancellationToken cancellationToken)
        {
            var grants = await BuildGrantMapAsync(context, cancellationToken);

            var moduleCodeById = await _db.Modules
                .AsNoTracking()
                .Select(m => new { m.Id, m.Code })
                .ToDictionaryAsync(m => m.Id, m => PermissionCatalog.CanonicalizeModule(m.Code), cancellationToken);

            var actionCodeById = await _db.Actions
                .AsNoTracking()
                .Select(a => new { a.Id, a.Code })
                .ToDictionaryAsync(a => a.Id, a => PermissionCatalog.Actions.Canonicalize(a.Code), cancellationToken);

            var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var entry in grants)
            {
                if (!entry.Value)
                {
                    continue;
                }

                if (!moduleCodeById.TryGetValue(entry.Key.ModuleId, out var moduleCode)
                    || string.IsNullOrWhiteSpace(moduleCode))
                {
                    continue;
                }

                if (!actionCodeById.TryGetValue(entry.Key.ActionId, out var actionCode)
                    || string.IsNullOrWhiteSpace(actionCode))
                {
                    continue;
                }

                result.Add($"{moduleCode}::{actionCode}");
            }

            return result;
        }

        private async Task<Dictionary<(string ModuleId, string ActionId), bool>> BuildGrantMapAsync(
            UserPermissionContext context,
            CancellationToken cancellationToken)
        {
            var result = new Dictionary<(string ModuleId, string ActionId), bool>();

            var rolePermissions = await _db.Permissions
                .AsNoTracking()
                .Where(p => context.RoleIds.Contains(p.RoleId))
                .Select(p => new { p.ModuleId, p.ActionId })
                .ToListAsync(cancellationToken);

            foreach (var permission in rolePermissions)
            {
                result[(permission.ModuleId, permission.ActionId)] = true;
            }

            if (context.UserSocieteId.HasValue && context.UserSocieteId.Value > 0)
            {
                var companyOverrides = await _db.CompanyRolePermissionOverrides
                    .AsNoTracking()
                    .Where(o => o.SocieteId == context.UserSocieteId.Value && o.RoleKey == context.PrimaryRoleKey)
                    .Select(o => new { o.ModuleId, o.ActionId, o.IsGranted })
                    .ToListAsync(cancellationToken);

                foreach (var overrideRow in companyOverrides)
                {
                    result[(overrideRow.ModuleId, overrideRow.ActionId)] = overrideRow.IsGranted;
                }

                var userOverrides = await _db.UserPermissionOverrides
                    .AsNoTracking()
                    .Where(o => o.UserId == context.UserId && o.SocieteId == context.UserSocieteId.Value)
                    .Select(o => new { o.ModuleId, o.ActionId, o.IsGranted })
                    .ToListAsync(cancellationToken);

                foreach (var overrideRow in userOverrides)
                {
                    result[(overrideRow.ModuleId, overrideRow.ActionId)] = overrideRow.IsGranted;
                }
            }

            await EnforceTenantDashboardReadOnlyAsync(context, result, cancellationToken);

            return result;
        }

        private async Task EnforceTenantDashboardReadOnlyAsync(
            UserPermissionContext context,
            Dictionary<(string ModuleId, string ActionId), bool> grants,
            CancellationToken cancellationToken)
        {
            if (!context.UserSocieteId.HasValue || context.UserSocieteId.Value <= 0)
            {
                return;
            }

            if (AppRoles.IsSuperAdminRoleKey(context.PrimaryRoleKey))
            {
                return;
            }

            var modules = await _db.Modules
                .AsNoTracking()
                .Select(module => new { module.Id, module.Code })
                .ToListAsync(cancellationToken);
            var actions = await _db.Actions
                .AsNoTracking()
                .Select(action => new { action.Id, action.Code })
                .ToListAsync(cancellationToken);

            var dashboardModuleId = modules
                .FirstOrDefault(module =>
                    string.Equals(
                        PermissionCatalog.CanonicalizeModule(module.Code),
                        MandatoryDashboardModuleCode,
                        StringComparison.OrdinalIgnoreCase))
                ?.Id;
            var readActionId = actions
                .FirstOrDefault(action =>
                    string.Equals(
                        PermissionCatalog.Actions.Canonicalize(action.Code),
                        MandatoryDashboardActionCode,
                        StringComparison.OrdinalIgnoreCase))
                ?.Id;

            if (string.IsNullOrWhiteSpace(dashboardModuleId) || string.IsNullOrWhiteSpace(readActionId))
            {
                return;
            }

            foreach (var action in actions)
            {
                if (string.IsNullOrWhiteSpace(action.Id))
                {
                    continue;
                }

                var canonicalAction = PermissionCatalog.Actions.Canonicalize(action.Code);
                grants[(dashboardModuleId, action.Id)] = string.Equals(
                    canonicalAction,
                    MandatoryDashboardActionCode,
                    StringComparison.OrdinalIgnoreCase);
            }

            grants[(dashboardModuleId, readActionId)] = true;
        }

        private async Task<UserPermissionContext?> LoadUserContextAsync(string userId, CancellationToken cancellationToken)
        {
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
            {
                return null;
            }

            var roleIds = await _db.UserRoles
                .AsNoTracking()
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync(cancellationToken);

            if (roleIds.Count == 0)
            {
                return new UserPermissionContext(
                    user.Id,
                    user.SocieteId,
                    user.PrimaryRoleKey,
                    Array.Empty<string>(),
                    string.Empty,
                    string.Empty);
            }

            var roles = await _db.Roles
                .AsNoTracking()
                .Where(role => roleIds.Contains(role.Id))
                .Select(role => new { role.Id, role.Name })
                .ToListAsync(cancellationToken);

            var primaryRoleName = AppRoles.ResolvePrimaryRole(roles.Select(r => r.Name ?? string.Empty), user.SocieteId);
            var primaryRoleKey = AppRoles.ToPrimaryRoleKey(primaryRoleName, user.SocieteId);
            var primaryRoleId = roles.FirstOrDefault(r => string.Equals(r.Name, primaryRoleName, StringComparison.OrdinalIgnoreCase))?.Id
                                ?? roles.First().Id;

            return new UserPermissionContext(
                user.Id,
                user.SocieteId,
                primaryRoleKey,
                roleIds,
                primaryRoleId,
                primaryRoleName);
        }

        private sealed record UserPermissionContext(
            string UserId,
            int? UserSocieteId,
            string PrimaryRoleKey,
            IReadOnlyCollection<string> RoleIds,
            string PrimaryRoleId,
            string PrimaryRoleName);
    }
}
