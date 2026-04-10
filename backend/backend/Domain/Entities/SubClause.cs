namespace Domain.Entities;

public class SubClause
{
    public Guid   Id       { get; set; } = Guid.NewGuid();
    public Guid   ClauseId { get; set; }
    public string Number   { get; set; } = default!;
    public string Title    { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public IsoClause? Clause { get; set; }
    public ConformityStatus? Conformity { get; set; }
}
