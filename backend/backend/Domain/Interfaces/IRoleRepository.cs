using Microsoft.AspNetCore.Identity;

namespace backend.Domain.Interfaces
{
    public interface IRoleRepository
    {
        Task<IdentityRole?> GetByIdAsync(string id);
        Task<IdentityRole?> GetByNameAsync(string name);
        Task<List<IdentityRole>> GetAllAsync();
    }
}
