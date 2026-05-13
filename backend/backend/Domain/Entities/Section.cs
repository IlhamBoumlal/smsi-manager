namespace backend.Domain.Entities;

public class Section
{
    public Guid   Id       { get; set; } = Guid.NewGuid();
    public Guid   PhaseId  { get; set; }
    public int?   SocieteId { get; set; }
    public string Title    { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Phase                  Phase { get; set; } = default!;
    public Societe?               Societe { get; set; }
    public ICollection<PdcaItem>  Items { get; set; } = new List<PdcaItem>();
}
