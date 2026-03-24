using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IHoldingRepository
    {
        Task<Holding?> GetByIdAsync(int id);
        Task<List<Holding>> GetAllAsync();
        Task AddAsync(Holding holding);
        Task UpdateAsync(Holding holding);
        Task DeleteAsync(Holding holding);
        Task SaveChangesAsync();
    }
}
