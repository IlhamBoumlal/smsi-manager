using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class ControleRepository : IControleRepository
    {
        private readonly AppDbContext _context;
        public ControleRepository(AppDbContext context) => _context = context;

        public Task<List<Controle>> GetAllAsync() =>
            _context.Controles.OrderBy(c => c.Code).ToListAsync();

        public Task<Controle?> GetByIdAsync(Guid id) =>
            _context.Controles.FirstOrDefaultAsync(c => c.Id == id);

        public async Task<Controle?> UpdateAsync(Controle controle)
        {
            var existing = await _context.Controles.FindAsync(controle.Id);
            if (existing is null) return null;

            existing.Titre = controle.Titre;
            existing.Description = controle.Description;
            existing.Domaine = controle.Domaine;
            existing.Statut = controle.Statut;
            existing.Applicable = controle.Applicable;
            existing.JustificationApplicabilite = controle.JustificationApplicabilite;
            existing.Preuves = controle.Preuves;
            existing.Responsable = controle.Responsable;
            existing.ReferenceDocument = controle.ReferenceDocument;
            existing.DateMiseAJour = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
