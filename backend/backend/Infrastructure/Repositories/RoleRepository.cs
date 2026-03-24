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

        public Task<IdentityRole?> GetByIdAsync(string id)
            => _roleManager.FindByIdAsync(id);

        public Task<IdentityRole?> GetByNameAsync(string name)
            => _roleManager.FindByNameAsync(name);

        public Task<List<IdentityRole>> GetAllAsync()
            => _roleManager.Roles.ToListAsync();
    }
}
