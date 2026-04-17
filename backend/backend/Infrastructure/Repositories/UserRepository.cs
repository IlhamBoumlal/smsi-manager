using backend.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public UserRepository(UserManager<ApplicationUser> userManager,
                              SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        public Task<ApplicationUser?> GetByIdAsync(string id)
            => _userManager.FindByIdAsync(id);

        public Task<ApplicationUser?> GetByEmailAsync(string email)
            => _userManager.Users.Include(u => u.Societe)
                                 .FirstOrDefaultAsync(u => u.Email == email);

        public Task<List<ApplicationUser>> GetAllWithSocieteAsync()
            => _userManager.Users.Include(u => u.Societe).ToListAsync();

        public Task<List<ApplicationUser>> GetActiveBySocieteAsync(int societeId)
            => _userManager.Users
                .Where(u => u.SocieteId == societeId && u.IsActive)
                .OrderBy(u => u.NomComplet)
                .ToListAsync();

        public Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
            => _userManager.CreateAsync(user, password);

        public Task<IdentityResult> UpdateAsync(ApplicationUser user)
            => _userManager.UpdateAsync(user);

        public Task<IList<string>> GetRolesAsync(ApplicationUser user)
            => _userManager.GetRolesAsync(user);

        public Task AddToRoleAsync(ApplicationUser user, string role)
            => _userManager.AddToRoleAsync(user, role);

        public Task RemoveFromRolesAsync(ApplicationUser user, IEnumerable<string> roles)
            => _userManager.RemoveFromRolesAsync(user, roles);

        public Task AddClaimsAsync(ApplicationUser user, IEnumerable<Claim> claims)
            => _userManager.AddClaimsAsync(user, claims);

        public Task<string> GeneratePasswordResetTokenAsync(ApplicationUser user)
            => _userManager.GeneratePasswordResetTokenAsync(user);

        public Task<IdentityResult> ResetPasswordAsync(ApplicationUser user, string token, string newPassword)
            => _userManager.ResetPasswordAsync(user, token, newPassword);

        public Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password)
            => _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);

        

        public Task<IdentityResult> DeleteAsync(ApplicationUser user)
            => _userManager.DeleteAsync(user);

        public async Task<List<ApplicationUser>> GetUsersByRoleAsync(string role)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            return usersInRole.ToList();
        }
    }
}
