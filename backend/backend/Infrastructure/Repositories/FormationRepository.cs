// Infrastructure/Repositories/FormationRepository.cs
using Microsoft.EntityFrameworkCore;
using backend.Domain.Entities;
using backend.Infrastructure.Data;

namespace backend.Infrastructure.Repositories;

public class FormationRepository(AppDbContext ctx) : IFormationRepository
{
    public async Task<IEnumerable<Formation>> GetAllAsync(
        int? societeId, CancellationToken ct = default)
    {
        var q = ctx.Formations
            .Include(f => f.Participants)
            .AsQueryable();

        if (societeId.HasValue)
            q = q.Where(f => f.SocieteId == societeId);

        return await q.OrderByDescending(f => f.DateDebut).ToListAsync(ct);
    }

    public async Task<Formation?> GetByIdAsync(Guid id, int? societeId, CancellationToken ct = default)
        => await ctx.Formations
            .Include(f => f.Participants)
            .Include(f => f.FormationDocuments)
            .Include(f => f.Notifications)
            .FirstOrDefaultAsync(f => f.Id == id && (societeId == null || f.SocieteId == societeId), ct);

    public async Task AddAsync(Formation formation, CancellationToken ct = default)
        => await ctx.Formations.AddAsync(formation, ct);


    //public async Task SaveChangesAsync(CancellationToken ct = default)
    //   => await ctx.SaveChangesAsync(ct);
    public async Task SaveChangesAsync(CancellationToken ct = default)
   => await ctx.SaveChangesAsync(ct);
    public void RemoveDocument(FormationDocument doc)
    => ctx.FormationDocuments.Remove(doc);
    public void Remove(Formation formation) => ctx.Formations.Remove(formation);
    public async Task AddDocumentAsync(FormationDocument doc, CancellationToken ct = default)
    => await ctx.FormationDocuments.AddAsync(doc, ct);
}