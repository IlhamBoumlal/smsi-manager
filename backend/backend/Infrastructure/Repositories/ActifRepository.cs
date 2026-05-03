using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
namespace backend.Infrastructure.Repositories
{
    public class ActifRepository : IActifRepository
    {
        private readonly AppDbContext _context;

        public ActifRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Actif>> GetAllAsync(int? societeId = null)
        {
            var query = _context.Actifs.AsNoTracking();
            if (societeId.HasValue)
                query = query.Where(a => a.SocieteId == societeId);
            else
                query = query.Where(_ => false);
            return await query.ToListAsync();
        }

        public async Task<Actif?> GetByIdAsync(Guid id, int? societeId = null)
        {
            var query = _context.Actifs.AsNoTracking().Where(a => a.Id == id);
            if (societeId.HasValue)
                query = query.Where(a => a.SocieteId == societeId);
            else
                query = query.Where(_ => false);
            return await query.FirstOrDefaultAsync();
        }

        public async Task<Actif> CreateAsync(Actif actif)
        {
            if (!actif.SocieteId.HasValue || actif.SocieteId.Value <= 0)
                throw new InvalidOperationException("SocieteId obligatoire pour creer un actif.");

            actif.Id = Guid.NewGuid();
            _context.Actifs.Add(actif);
            await _context.SaveChangesAsync();
            return actif;
        }

        public async Task<Actif?> UpdateAsync(Actif actif)
        {
            var existing = await _context.Actifs.FindAsync(actif.Id);
            if (!actif.SocieteId.HasValue || existing is null || existing.SocieteId != actif.SocieteId) return null;

            existing.Nom = actif.Nom;
            existing.Description = actif.Description;
            existing.Type = actif.Type;
            existing.Categorie = actif.Categorie;
            existing.Classification = actif.Classification;
            existing.ProprietaireId = actif.ProprietaireId;
            existing.SocieteId = actif.SocieteId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(Guid id, int? societeId = null)
        {
            var actif = await _context.Actifs.FindAsync(id);
            if (!societeId.HasValue || actif is null || actif.SocieteId != societeId) return false;

            _context.Actifs.Remove(actif);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
