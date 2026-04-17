namespace backend.Domain.Entities;

public class ActionCorrective
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid NonConformiteId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Responsible { get; set; }
    public DateTime? Deadline { get; set; }
    public string Status { get; set; } = "pending"; // pending | in-progress | completed

    // Navigation
    public NonConformite NonConformite { get; set; } = null!;
}