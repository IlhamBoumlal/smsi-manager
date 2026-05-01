namespace backend.Domain.Entities;

public class Audit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "external_cert"; // external_cert | external_surv | supplier
    public string Status { get; set; } = "planned";       // planned | in-progress | completed
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Auditor { get; set; } = string.Empty;
    public string Org { get; set; } = string.Empty;
    public string? Rssi { get; set; }
    public string? Approver { get; set; }
    public string? Scope { get; set; }
    public string? Objectives { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? Author { get; set; }
    public string? Date { get; set; }
    // Navigation
    public ICollection<AuditControlStatus> ControlStatuses { get; set; } = new List<AuditControlStatus>();
    public ICollection<NonConformite> NonConformites { get; set; } = new List<NonConformite>();
}