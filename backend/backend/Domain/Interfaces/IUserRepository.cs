using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace backend.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<ApplicationUser?> GetByIdAsync(string id);
        Task<ApplicationUser?> GetByEmailAsync(string email);
        Task<List<ApplicationUser>> GetAllWithSocieteAsync();
        Task<IdentityResult> CreateAsync(ApplicationUser user, string password);
        Task<IdentityResult> UpdateAsync(ApplicationUser user);
        Task<IList<string>> GetRolesAsync(ApplicationUser user);
        Task AddToRoleAsync(ApplicationUser user, string role);
        Task RemoveFromRolesAsync(ApplicationUser user, IEnumerable<string> roles);
        Task AddClaimsAsync(ApplicationUser user, IEnumerable<Claim> claims);
        Task<string> GeneratePasswordResetTokenAsync(ApplicationUser user);
        Task<IdentityResult> ResetPasswordAsync(ApplicationUser user, string token, string newPassword);
        Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password);
        Task<IdentityResult> DeleteAsync(ApplicationUser user);

    }

}
