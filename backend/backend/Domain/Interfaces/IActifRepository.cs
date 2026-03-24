using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IActifRepository
    {
        Task<IEnumerable<Actif>> GetAllAsync();
        Task<Actif?> GetByIdAsync(Guid id);
        Task<Actif> CreateAsync(Actif actif);
        Task<Actif?> UpdateAsync(Actif actif);
        Task<bool> DeleteAsync(Guid id);
    }
}
