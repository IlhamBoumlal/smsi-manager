using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class ModuleRepository : IModuleRepository
    {
        private readonly AppDbContext _context;

        public ModuleRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Module>> GetAllModulesAsync()
        {
            return await _context.Modules
                .ToListAsync();
        }

        public async Task<Module?> GetModuleByIdAsync(string id)
        {
            return await _context.Modules.FindAsync(id);
        }

        public async Task<Module?> GetModuleByCodeAsync(string code)
        {
            return await _context.Modules
                .FirstOrDefaultAsync(m => m.Code == code);
        }

        public async Task<Module> CreateModuleAsync(Module module)
        {
            module.Id = Guid.NewGuid().ToString();
            module.CreatedAt = DateTime.UtcNow;
            _context.Modules.Add(module);
            await _context.SaveChangesAsync();
            return module;
        }

        public async Task<Module> UpdateModuleAsync(Module module)
        {
            module.UpdatedAt = DateTime.UtcNow;
            _context.Entry(module).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return module;
        }

        public async Task<bool> DeleteModuleAsync(string id)
        {
            var module = await GetModuleByIdAsync(id);
            if (module == null) return false;

            _context.Modules.Remove(module);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ModuleExistsAsync(string code)
        {
            return await _context.Modules.AnyAsync(m => m.Code == code);
        }
    }
}
