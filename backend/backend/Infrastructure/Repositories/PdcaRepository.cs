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

    private IQueryable<PdcaCycle> ApplyCycleFilter(int? societeId)
        => societeId.HasValue
            ? _context.PdcaCycles.Where(c => c.SocieteId == societeId.Value)
            : _context.PdcaCycles.Where(c => false);

    private IQueryable<Phase> ApplyPhaseFilter(int? societeId)
        => societeId.HasValue
            ? _context.Phases.Include(p => p.Cycle).Where(p => p.Cycle.SocieteId == societeId.Value)
            : _context.Phases.Where(p => false);

    private IQueryable<Section> ApplySectionFilter(int? societeId)
        => societeId.HasValue
            ? _context.Sections
                .Include(s => s.Phase)
                    .ThenInclude(p => p.Cycle)
                .Where(s => s.Phase.Cycle.SocieteId == societeId.Value)
            : _context.Sections.Where(s => false);

    private IQueryable<PdcaItem> ApplyItemFilter(int? societeId)
        => societeId.HasValue
            ? _context.PdcaItems
                .Include(i => i.Section)
                    .ThenInclude(s => s.Phase)
                        .ThenInclude(p => p.Cycle)
                .Where(i => i.Section.Phase.Cycle.SocieteId == societeId.Value)
            : _context.PdcaItems.Where(i => false);

    // Cycles
    public async Task<PdcaCycle?> GetByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplyCycleFilter(societeId)
            .Include(c => c.Phases)
                .ThenInclude(p => p.Sections)
                    .ThenInclude(s => s.Items)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<IEnumerable<PdcaCycle>> GetAllAsync(int? societeId = null, CancellationToken ct = default)
    {
        return await ApplyCycleFilter(societeId)
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
    public async Task<Phase?> GetPhaseByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplyPhaseFilter(societeId)
            .Include(p => p.Sections)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IEnumerable<Phase>> GetPhasesByCycleIdAsync(Guid cycleId, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplyPhaseFilter(societeId)
            .Where(p => p.CycleId == cycleId)
            .OrderBy(p => p.Order)
            .ToListAsync(ct);
    }

    // Sections
    public async Task<Section?> GetSectionByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplySectionFilter(societeId)
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }

    public async Task<IEnumerable<Section>> GetSectionsByPhaseIdAsync(Guid phaseId, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplySectionFilter(societeId)
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
    public async Task<PdcaItem?> GetItemByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplyItemFilter(societeId)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<IEnumerable<PdcaItem>> GetItemsBySectionIdAsync(Guid sectionId, int? societeId = null, CancellationToken ct = default)
    {
        return await ApplyItemFilter(societeId)
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
    public async Task<bool> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct) > 0;
    }
}