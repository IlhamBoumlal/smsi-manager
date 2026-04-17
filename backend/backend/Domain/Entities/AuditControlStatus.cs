namespace backend.Domain.Entities;

/// <summary>
/// Résultat d'un contrôle ISO 27001 dans le cadre d'un audit post-audit (C / NC / NA).
/// </summary>
public class AuditControlStatus
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AuditId { get; set; }
    public string ControlId { get; set; } = string.Empty; // ex: "5.1", "8.3"
    public string Statut { get; set; } = "NA";         // C | NC | NA
    public string? Comment { get; set; }

    // Navigation
    public Audit Audit { get; set; } = null!;
}