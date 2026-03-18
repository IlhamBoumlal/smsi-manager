using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IControleRepository
    {
        Task<List<Controle>> GetAllAsync();
        Task<Controle?> GetByIdAsync(Guid id);
        Task<Controle?> UpdateAsync(Controle controle);
    }
}
