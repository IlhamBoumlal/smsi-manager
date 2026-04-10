namespace Domain.Entities;

public class PdcaCycle
{
    public Guid     Id        { get; set; } = Guid.NewGuid();
    public string   Name      { get; set; } = default!;
    public bool     IsActive  { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Phase> Phases { get; set; } = new List<Phase>();
}
