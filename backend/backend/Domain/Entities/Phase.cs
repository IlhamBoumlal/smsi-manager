namespace backend.Domain.Entities;

public class Phase
{
    public Guid   Id       { get; set; } = Guid.NewGuid();
    public Guid   CycleId  { get; set; }
    public string Key      { get; set; } = default!;
    public string Label    { get; set; } = default!;
    public int    Order    { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public PdcaCycle              Cycle    { get; set; } = default!;
    public ICollection<Section>   Sections { get; set; } = new List<Section>();
}
