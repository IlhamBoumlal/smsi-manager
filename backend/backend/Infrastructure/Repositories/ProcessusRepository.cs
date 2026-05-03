using backend.Domain.Entities;
using backend.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using backend.Infrastructure.Data;

namespace backend.Infrastructure.Repositories;

public class ProcessusRepository : IProcessusRepository
{
    private readonly AppDbContext _ctx;
    public ProcessusRepository(AppDbContext ctx) => _ctx = ctx;

    public Task<List<Processus>> GetAllAsync(int? societeId = null, CancellationToken ct = default)
    {
        var query = _ctx.Processus.Include(p => p.Documents).AsQueryable();
        query = societeId.HasValue
            ? query.Where(p => p.SocieteId == societeId.Value)
            : query.Where(_ => false);
        return query.ToListAsync(ct);
    }

    public Task<Processus?> GetByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default)
    {
        var query = _ctx.Processus.Include(p => p.Documents).Where(p => p.Id == id).AsQueryable();
        query = societeId.HasValue
            ? query.Where(p => p.SocieteId == societeId.Value)
            : query.Where(_ => false);
        return query.FirstOrDefaultAsync(ct);
    }

    public async Task AddAsync(Processus p, CancellationToken ct = default) =>
        await _ctx.Processus.AddAsync(p, ct);

    public void Remove(Processus p) => _ctx.Processus.Remove(p);

    public Task SaveChangesAsync(CancellationToken ct = default) => _ctx.SaveChangesAsync(ct);

    public async Task AddDocumentAsync(Document document, CancellationToken ct = default)
    {
        await _ctx.Documents.AddAsync(document, ct);
    }
}
