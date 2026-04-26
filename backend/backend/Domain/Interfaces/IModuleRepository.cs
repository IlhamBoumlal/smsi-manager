using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IModuleRepository
    {
        Task<List<Module>> GetAllModulesAsync();
        Task<Module?> GetModuleByIdAsync(string id);
        Task<Module?> GetModuleByCodeAsync(string code);
        Task<Module> CreateModuleAsync(Module module);
        Task<Module> UpdateModuleAsync(Module module);
        Task<bool> DeleteModuleAsync(string id);
        Task<bool> ModuleExistsAsync(string code);
    }
}
