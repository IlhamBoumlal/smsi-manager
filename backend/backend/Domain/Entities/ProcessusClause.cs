namespace backend.Domain.Entities;

/// <summary>
/// Table pivot pour la relation many-to-many entre Processus et IsoClause
/// Représente l'association entre un processus et les clauses ISO 27001 qui lui sont liées
/// </summary>
public class ProcessusClause
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // FK vers Processus
    public Guid ProcessusId { get; set; }
    public Processus? Processus { get; set; }
    
    // FK vers IsoClause
    public int ClauseId { get; set; }
    public IsoClause? Clause { get; set; }
    
    // Métadonnées
    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Justification optionnelle de la relation
    public string? Justification { get; set; }
}
