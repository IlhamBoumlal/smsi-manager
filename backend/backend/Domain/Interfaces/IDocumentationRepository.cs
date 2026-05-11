using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IDocumentationRepository
    {
        Task<IEnumerable<DocumentationDocument>> GetAllAsync(int? societeId);
        Task<DocumentationDocument?> GetByIdAsync(Guid id, int? societeId);
        Task<DocumentationDocument> CreateAsync(DocumentationDocument document);
        Task<DocumentationDocument?> UpdateAsync(DocumentationDocument document);
        Task<bool> DeleteAsync(Guid id, int? societeId);
    }
}
