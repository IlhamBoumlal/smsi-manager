using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IActifRepository
    {
        Task<IEnumerable<Actif>> GetAllAsync(int? societeId = null);
        Task<Actif?> GetByIdAsync(Guid id, int? societeId = null);
        Task<Actif> CreateAsync(Actif actif);
        Task<Actif?> UpdateAsync(Actif actif);
        Task<bool> DeleteAsync(Guid id, int? societeId = null);
    }
}
