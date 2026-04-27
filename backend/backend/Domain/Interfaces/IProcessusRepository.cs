using backend.Domain.Entities;

namespace backend.Domain.Interfaces;

public interface IProcessusRepository
{
    Task<List<Processus>> GetAllAsync(int? societeId = null, CancellationToken ct = default);
    Task<Processus?> GetByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default);
    Task AddAsync(Processus processus, CancellationToken ct = default);
    void Remove(Processus processus);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task AddDocumentAsync(Document document, CancellationToken ct = default);
}