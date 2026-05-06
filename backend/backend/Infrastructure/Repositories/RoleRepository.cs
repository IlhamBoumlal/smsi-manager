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
            if (string.IsNullOrWhiteSpace(roleName))
                return IdentityResult.Failed(new IdentityError { Description = "Le nom du rôle ne peut pas être vide" });

            var role = new IdentityRole(roleName);
            return await _roleManager.CreateAsync(role);
        }

        public async Task<IdentityResult> UpdateAsync(string roleId, string newRoleName)
        {
            if (string.IsNullOrWhiteSpace(roleId))
                return IdentityResult.Failed(new IdentityError { Description = "L'ID du rôle est requis" });

            if (string.IsNullOrWhiteSpace(newRoleName))
                return IdentityResult.Failed(new IdentityError { Description = "Le nouveau nom du rôle ne peut pas être vide" });

            var role = await GetByIdAsync(roleId);  // Utilisation de GetByIdAsync
            if (role == null)
                return IdentityResult.Failed(new IdentityError { Description = "Rôle non trouvé" });

            role.Name = newRoleName;
            role.NormalizedName = newRoleName.ToUpperInvariant();

            return await _roleManager.UpdateAsync(role);
        }

        public async Task<IdentityResult> DeleteAsync(string roleId)
        {
            if (string.IsNullOrWhiteSpace(roleId))
                return IdentityResult.Failed(new IdentityError { Description = "L'ID du rôle est requis" });

            var role = await GetByIdAsync(roleId);  // Utilisation de GetByIdAsync
            if (role == null)
                return IdentityResult.Failed(new IdentityError { Description = "Rôle non trouvé" });

            return await _roleManager.DeleteAsync(role);
        }
    }
}
