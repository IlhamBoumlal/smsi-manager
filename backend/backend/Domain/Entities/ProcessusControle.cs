namespace backend.Domain.Entities;

/// <summary>
/// Table pivot pour la relation many-to-many entre Processus et Controle
/// Représente l'association entre un processus et les contrôles ISO 27001 qui lui sont liés
/// </summary>
public class ProcessusControle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // FK vers Processus
    public Guid ProcessusId { get; set; }
    public Processus? Processus { get; set; }
    
    // FK vers Controle
    public Guid ControleId { get; set; }
    public Controle? Controle { get; set; }
    
    // Métadonnées
    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Justification optionnelle de la relation (comment ce contrôle s'applique au processus)
    public string? Justification { get; set; }
}
