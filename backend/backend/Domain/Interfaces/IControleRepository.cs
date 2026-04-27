using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IControleRepository
    {
        Task<List<Controle>> GetAllAsync(int? societeId = null, CancellationToken ct = default);
        Task<Controle?> GetByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default);
        Task<Controle?> UpdateAsync(Controle controle);
    }
}
