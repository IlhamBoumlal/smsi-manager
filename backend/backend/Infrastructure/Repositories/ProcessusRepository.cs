using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using backend.Infrastructure.Data;

namespace Infrastructure.Repositories;

public class ProcessusRepository : IProcessusRepository
{
    private readonly AppDbContext _ctx;
    public ProcessusRepository(AppDbContext ctx) => _ctx = ctx;

    public Task<List<Processus>> GetAllAsync(CancellationToken ct = default) =>
        _ctx.Processus.Include(p => p.Documents).ToListAsync(ct);

    public Task<Processus?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _ctx.Processus.Include(p => p.Documents).FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(Processus p, CancellationToken ct = default) =>
        await _ctx.Processus.AddAsync(p, ct);

    public void Remove(Processus p) => _ctx.Processus.Remove(p);

    public Task SaveChangesAsync(CancellationToken ct = default) => _ctx.SaveChangesAsync(ct);

    public async Task AddDocumentAsync(Document document, CancellationToken ct = default)
    {
        await _ctx.Documents.AddAsync(document, ct);
    }
}