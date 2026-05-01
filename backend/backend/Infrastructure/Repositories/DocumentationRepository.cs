using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class DocumentationRepository : IDocumentationRepository
    {
        private readonly AppDbContext _context;

        public DocumentationRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<DocumentationDocument>> GetAllAsync(int? societeId) =>
            await _context.DocumentationDocuments
                .AsNoTracking()
                .Where(d => societeId.HasValue ? d.SocieteId == societeId.Value || d.SocieteId == null : d.SocieteId == null)
                .OrderByDescending(d => d.UpdatedAt)
                .ToListAsync();

        public async Task<DocumentationDocument?> GetByIdAsync(Guid id, int? societeId) =>
            await _context.DocumentationDocuments
                .AsNoTracking()
                .Where(d => societeId.HasValue ? d.SocieteId == societeId.Value || d.SocieteId == null : d.SocieteId == null)
                .FirstOrDefaultAsync(d => d.Id == id);

        public async Task<DocumentationDocument> CreateAsync(DocumentationDocument document)
        {
            document.Id = Guid.NewGuid();
            document.CreatedAt = DateTime.UtcNow;
            document.UpdatedAt = DateTime.UtcNow;

            _context.DocumentationDocuments.Add(document);
            await _context.SaveChangesAsync();
            return document;
        }

        public async Task<DocumentationDocument?> UpdateAsync(DocumentationDocument document)
        {
            var existing = await _context.DocumentationDocuments.FindAsync(document.Id);
            if (existing is null) return null;

            existing.Name = document.Name;
            existing.Type = document.Type;
            existing.Category = document.Category;
            existing.Status = document.Status;
            existing.Version = document.Version;
            existing.Classification = document.Classification;
            existing.Author = document.Author;
            existing.Approver = document.Approver;
            existing.Clause = document.Clause;
            existing.Controle = document.Controle;
            existing.Description = document.Description;
            existing.FilePath = document.FilePath;
            existing.OriginalFileName = document.OriginalFileName;
            existing.FileSizeBytes = document.FileSizeBytes;
            existing.FileHash = document.FileHash;
            existing.SocieteId = document.SocieteId;
            existing.CreatedByUserId = document.CreatedByUserId;
            existing.LastModifiedByUserId = document.LastModifiedByUserId;
            existing.ApprovedByUserId = document.ApprovedByUserId;
            existing.ApprovedAt = document.ApprovedAt;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(Guid id, int? societeId)
        {
            var existing = await _context.DocumentationDocuments
                .Where(d => societeId.HasValue ? d.SocieteId == societeId.Value || d.SocieteId == null : d.SocieteId == null)
                .FirstOrDefaultAsync(d => d.Id == id);
            if (existing is null) return false;

            _context.DocumentationDocuments.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
