namespace backend.Domain.Entities;

public class NonConformite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ControlId { get; set; } = string.Empty; // ex: "8.3"
    public string? Actor { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? Responsible { get; set; }
    public DateTime? Deadline { get; set; }
    public string Status { get; set; } = "open"; // open | in-progress | resolved
    public string? AuditName { get; set; }
    public Guid? AuditId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Audit? Audit { get; set; }
    public ICollection<ActionCorrective> CorrectiveActions { get; set; } = new List<ActionCorrective>();
}