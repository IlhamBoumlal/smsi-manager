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

        public async Task<IEnumerable<Actif>> GetAllAsync() =>
            await _context.Actifs.AsNoTracking().ToListAsync();

        public async Task<Actif?> GetByIdAsync(Guid id) =>
            await _context.Actifs.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

        public async Task<Actif> CreateAsync(Actif actif)
        {
            actif.Id = Guid.NewGuid();
            _context.Actifs.Add(actif);
            await _context.SaveChangesAsync();
            return actif;
        }

        public async Task<Actif?> UpdateAsync(Actif actif)
        {
            var existing = await _context.Actifs.FindAsync(actif.Id);
            if (existing is null) return null;

            existing.Nom = actif.Nom;
            existing.Description = actif.Description;
            existing.Type = actif.Type;
            existing.Categorie = actif.Categorie;
            existing.Classification = actif.Classification;
            existing.ProprietaireId = actif.ProprietaireId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var actif = await _context.Actifs.FindAsync(id);
            if (actif is null) return false;

            _context.Actifs.Remove(actif);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
