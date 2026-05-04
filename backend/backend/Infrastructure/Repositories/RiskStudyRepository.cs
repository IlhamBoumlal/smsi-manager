using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class RiskStudyRepository : IRiskStudyRepository
    {
        private readonly AppDbContext _context;

        public RiskStudyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RiskStudy>> GetAllBySocieteAsync(int societeId)
        {
            return await _context.RiskStudies
                .AsNoTracking()
                .Where(s => s.SocieteId == societeId)
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();
        }

        public async Task<RiskStudy?> GetByIdAsync(Guid id, int? societeId)
        {
            return await _context.RiskStudies
                .AsNoTracking()
                .Where(s => societeId.HasValue && s.SocieteId == societeId.Value)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<RiskStudy> CreateAsync(RiskStudy study)
        {
            study.Id = Guid.NewGuid();
            study.CreatedAt = DateTime.UtcNow;
            study.UpdatedAt = DateTime.UtcNow;

            _context.RiskStudies.Add(study);
            await _context.SaveChangesAsync();
            return study;
        }

        public async Task<RiskStudy?> UpdateAsync(RiskStudy study)
        {
            var existing = await _context.RiskStudies.FindAsync(study.Id);
            if (existing is null) return null;

            existing.Name = study.Name;
            existing.Organization = study.Organization;
            existing.Description = study.Description;
            existing.Perimeter = study.Perimeter;
            existing.Author = study.Author;
            existing.PayloadJson = study.PayloadJson;
            existing.LastModifiedByUserId = study.LastModifiedByUserId;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(Guid id, int? societeId)
        {
            var existing = await _context.RiskStudies
                .Where(s => societeId.HasValue && s.SocieteId == societeId.Value)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (existing is null) return false;

            _context.RiskStudies.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
