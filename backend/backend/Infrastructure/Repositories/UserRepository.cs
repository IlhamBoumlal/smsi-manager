using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly AppDbContext _context;

        public UserRepository(UserManager<ApplicationUser> userManager,
                              SignInManager<ApplicationUser> signInManager,
                              AppDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
        }

        // Récupère l'utilisateur avec sa société
        public async Task<ApplicationUser?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .Include(u => u.Societe)
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }

        // Récupère l'ID du rôle d'un utilisateur via la table de liaison
        public async Task<string?> GetRoleIdByUserIdAsync(string userId, CancellationToken cancellationToken = default)
        {
            var userRole = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.RoleId, r.Name })
                .FirstOrDefaultAsync(cancellationToken);

            return userRole?.RoleId;
        }

        public async Task<ApplicationUser?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Societe)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<List<ApplicationUser>> GetAllWithSocieteAsync()
        {
            return await _context.Users
                .Include(u => u.Societe)
                .ToListAsync();
        }

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