using backend.Infrastructure.Data;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories;

public class PdcaRepository : IPdcaRepository
{
    private readonly AppDbContext _context;

    public PdcaRepository(AppDbContext context)
    {
        _context = context;
    }

    // Cycles
    public async Task<PdcaCycle?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.PdcaCycles
            .Include(c => c.Phases)
                .ThenInclude(p => p.Sections)
                    .ThenInclude(s => s.Items)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<IEnumerable<PdcaCycle>> GetAllAsync(CancellationToken ct)
    {
        return await _context.PdcaCycles
            .Include(c => c.Phases)
            .ToListAsync(ct);
    }

    public void Add(PdcaCycle cycle)
    {
        _context.PdcaCycles.Add(cycle);
    }

    public void Update(PdcaCycle cycle)
    {
        _context.Entry(cycle).State = EntityState.Modified;
    }

    public void Remove(PdcaCycle cycle)
    {
        _context.PdcaCycles.Remove(cycle);
    }

    // Phases
    public async Task<Phase?> GetPhaseByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Phases
            .Include(p => p.Sections)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IEnumerable<Phase>> GetPhasesByCycleIdAsync(Guid cycleId, CancellationToken ct)
    {
        return await _context.Phases
            .Where(p => p.CycleId == cycleId)
            .OrderBy(p => p.Order)
            .ToListAsync(ct);
    }

    // Sections
    public async Task<Section?> GetSectionByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Sections
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }

    public async Task<IEnumerable<Section>> GetSectionsByPhaseIdAsync(Guid phaseId, CancellationToken ct)
    {
        return await _context.Sections
            .Where(s => s.PhaseId == phaseId)
            .ToListAsync(ct);
    }

    public void AddSection(Section section)
    {
        _context.Sections.Add(section);
    }

    public void RemoveSection(Section section)
    {
        _context.Sections.Remove(section);
    }

    // Items
    public async Task<PdcaItem?> GetItemByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.PdcaItems
            .FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<IEnumerable<PdcaItem>> GetItemsBySectionIdAsync(Guid sectionId, CancellationToken ct)
    {
        return await _context.PdcaItems
            .Where(i => i.SectionId == sectionId)
            .ToListAsync(ct);
    }

    public void AddItem(PdcaItem item)
    {
        _context.PdcaItems.Add(item);
    }

    public void RemoveItem(PdcaItem item)
    {
        _context.PdcaItems.Remove(item);
    }

    // Sauvegarde
    public async Task<bool> SaveChangesAsync(CancellationToken ct)
    {
        return await _context.SaveChangesAsync(ct) > 0;
    }
}