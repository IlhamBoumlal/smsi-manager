// Infrastructure/Repositories/IFormationRepository.cs
using backend.Domain.Entities;

namespace backend.Infrastructure.Repositories;

public interface IFormationRepository
{
    Task<IEnumerable<Formation>> GetAllAsync(Guid? societeId, CancellationToken ct = default);
    Task<Formation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Formation formation, CancellationToken ct = default);
    void Remove(Formation formation);           // ← nécessaire pour la suppression
    void RemoveDocument(FormationDocument doc); // ← déjà utilisé dans DeleteFormationDocumentCommandHandler
    Task AddDocumentAsync(FormationDocument doc, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
}