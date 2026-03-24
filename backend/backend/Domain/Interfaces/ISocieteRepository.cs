using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface ISocieteRepository
    {
        Task<Societe?> GetByIdAsync(int id);
        Task<List<Societe>> GetAllAsync(int? holdingId = null);
        Task AddAsync(Societe societe);
        Task UpdateAsync(Societe societe);
        Task DeleteAsync(Societe societe);
        Task SaveChangesAsync();
    }
}
