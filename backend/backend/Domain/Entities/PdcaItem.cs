namespace backend.Domain.Entities;

public class PdcaItem
{
    public Guid   Id        { get; set; } = Guid.NewGuid();
    public Guid   SectionId { get; set; }
    public string Text      { get; set; } = default!;
    public string Status    { get; set; } = "todo";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Section Section { get; set; } = default!;
}
