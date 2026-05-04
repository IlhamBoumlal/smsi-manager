using Microsoft.AspNetCore.Identity;

namespace backend.Domain.Interfaces
{
    public interface IRoleRepository
    {
        Task<List<IdentityRole>> GetAllAsync();
        Task<IdentityRole?> GetByIdAsync(string roleId);  // Ajout de cette méthode
        Task<IdentityResult> CreateAsync(string roleName);
        Task<IdentityResult> UpdateAsync(string roleId, string newRoleName);
        Task<IdentityResult> DeleteAsync(string roleId);
    }
}
