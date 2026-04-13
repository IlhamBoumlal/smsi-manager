using Domain.Entities;

namespace Domain.Interfaces;

public interface IPdcaRepository
{
    // Cycles
    Task<PdcaCycle?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<PdcaCycle>> GetAllAsync(CancellationToken ct);
    void Add(PdcaCycle cycle);
    void Update(PdcaCycle cycle);
    void Remove(PdcaCycle cycle);

    // Phases
    Task<Phase?> GetPhaseByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<Phase>> GetPhasesByCycleIdAsync(Guid cycleId, CancellationToken ct);

    // Sections
    Task<Section?> GetSectionByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<Section>> GetSectionsByPhaseIdAsync(Guid phaseId, CancellationToken ct);
    void AddSection(Section section);
    void RemoveSection(Section section);

    // Items
    Task<PdcaItem?> GetItemByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<PdcaItem>> GetItemsBySectionIdAsync(Guid sectionId, CancellationToken ct);
    void AddItem(PdcaItem item);
    void RemoveItem(PdcaItem item);

    // Sauvegarde
    Task<bool> SaveChangesAsync(CancellationToken ct);
}