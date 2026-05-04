using backend.Application.Security;
using backend.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        public RoleRepository(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task<List<IdentityRole>> GetAllAsync()
        {
            return await _roleManager.Roles.ToListAsync();
        }

        public async Task<IdentityRole?> GetByIdAsync(string roleId)
        {
            return await _roleManager.FindByIdAsync(roleId);
        }

        public async Task<IdentityResult> CreateAsync(string roleName)
        {
            if (!TryResolveFinalRoleName(roleName, out var canonicalRoleName))
            {
                return IdentityResult.Failed(new IdentityError { Description = "Seuls les 5 rôles officiels sont autorisés." });
            }

            if (await _roleManager.RoleExistsAsync(canonicalRoleName))
            {
                return IdentityResult.Failed(new IdentityError { Description = "Ce rôle existe déjà." });
            }

            var role = new IdentityRole(canonicalRoleName)
            {
                NormalizedName = canonicalRoleName.ToUpperInvariant()
            };

            return await _roleManager.CreateAsync(role);
        }

        public async Task<IdentityResult> UpdateAsync(string roleId, string newRoleName)
        {
            if (string.IsNullOrWhiteSpace(roleId))
                return IdentityResult.Failed(new IdentityError { Description = "L'ID du rôle est requis" });

            if (!TryResolveFinalRoleName(newRoleName, out var canonicalRoleName))
            {
                return IdentityResult.Failed(new IdentityError { Description = "Seuls les 5 rôles officiels sont autorisés." });
            }

            var role = await GetByIdAsync(roleId);
            if (role == null)
                return IdentityResult.Failed(new IdentityError { Description = "Rôle non trouvé" });

            role.Name = canonicalRoleName;
            role.NormalizedName = canonicalRoleName.ToUpperInvariant();

            return await _roleManager.UpdateAsync(role);
        }

        public async Task<IdentityResult> DeleteAsync(string roleId)
        {
            if (string.IsNullOrWhiteSpace(roleId))
                return IdentityResult.Failed(new IdentityError { Description = "L'ID du rôle est requis" });

            var role = await GetByIdAsync(roleId);
            if (role == null)
                return IdentityResult.Failed(new IdentityError { Description = "Rôle non trouvé" });

            if (AppRoles.IsFinalRole(role.Name))
            {
                return IdentityResult.Failed(new IdentityError { Description = "Suppression interdite pour un rôle officiel." });
            }

            return await _roleManager.DeleteAsync(role);
        }

        private static bool TryResolveFinalRoleName(string? roleName, out string canonicalRoleName)
        {
            var requestedKey = AppRoles.NormalizeKey(roleName);

            foreach (var finalRole in AppRoles.FinalRoles)
            {
                if (string.Equals(AppRoles.NormalizeKey(finalRole), requestedKey, StringComparison.OrdinalIgnoreCase))
                {
                    canonicalRoleName = finalRole;
                    return true;
                }
            }

            canonicalRoleName = string.Empty;
            return false;
        }
    }
}
