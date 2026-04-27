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

        public Task<List<Controle>> GetAllAsync(int? societeId = null, CancellationToken ct = default) =>
            ApplyFilter(societeId).OrderBy(c => c.Code).ToListAsync(ct);

        public Task<Controle?> GetByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default) =>
            ApplyFilter(societeId).FirstOrDefaultAsync(c => c.Id == id, ct);

        private IQueryable<Controle> ApplyFilter(int? societeId) =>
            societeId.HasValue
                ? _context.Controles.Where(c => c.SocieteId == null || c.SocieteId == societeId.Value)
                : _context.Controles;
        public async Task<Controle?> UpdateAsync(Controle controle)
        {
            var existing = await _context.Controles.FindAsync(controle.Id);
            if (existing is null) return null;

            existing.Code = controle.Code;
            existing.Titre = controle.Titre;
            existing.Description = controle.Description;
            existing.Domaine = controle.Domaine;

            // Applicabilité
            existing.Applicable = controle.Applicable;
            existing.RaisonsApplicabilite = controle.RaisonsApplicabilite;
            existing.RaisonExclusion = controle.RaisonExclusion;

            // Évaluation
            existing.Statut = controle.Statut;
            existing.JustificationConformite = controle.JustificationConformite;
            existing.Remarque = controle.Remarque;
            existing.Preuves = controle.Preuves;

            // Plan d'action
            existing.Steps = controle.Steps;
            existing.Priorite = controle.Priorite;
            existing.StatutPlan = controle.StatutPlan;
            existing.ResponsablePlan = controle.ResponsablePlan;
            existing.DateEcheance = controle.DateEcheance;

            existing.DateMiseAJour = controle.DateMiseAJour ?? DateTime.UtcNow;
            existing.DernierModificateurId = controle.DernierModificateurId;
            existing.DernierModificateurNom = controle.DernierModificateurNom;

            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
