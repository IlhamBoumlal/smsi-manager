using backend.Domain.Entities;

namespace backend.Domain.Interfaces;

public interface IPdcaRepository
{
    // Cycles
    Task<PdcaCycle?> GetByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default);
    Task<IEnumerable<PdcaCycle>> GetAllAsync(int? societeId = null, CancellationToken ct = default);
    void Add(PdcaCycle cycle);
    void Update(PdcaCycle cycle);
    void Remove(PdcaCycle cycle);

    // Phases
    Task<Phase?> GetPhaseByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default);
    Task<IEnumerable<Phase>> GetPhasesByCycleIdAsync(Guid cycleId, int? societeId = null, CancellationToken ct = default);

    // Sections
    Task<Section?> GetSectionByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default);
    Task<IEnumerable<Section>> GetSectionsByPhaseIdAsync(Guid phaseId, int? societeId = null, CancellationToken ct = default);
    void AddSection(Section section);
    void RemoveSection(Section section);

    // Items
    Task<PdcaItem?> GetItemByIdAsync(Guid id, int? societeId = null, CancellationToken ct = default);
    Task<IEnumerable<PdcaItem>> GetItemsBySectionIdAsync(Guid sectionId, int? societeId = null, CancellationToken ct = default);
    void AddItem(PdcaItem item);
    void RemoveItem(PdcaItem item);

    // Sauvegarde
    Task<bool> SaveChangesAsync(CancellationToken ct = default);
}