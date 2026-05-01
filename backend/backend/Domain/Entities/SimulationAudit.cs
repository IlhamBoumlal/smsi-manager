namespace backend.Domain.Entities;

/// <summary>
/// Représente une simulation d'audit ISO 27001 sauvegardée (historique).
/// Les réponses et commentaires sont stockés en JSON dans la colonne AnswersJson / CommentsJson.
/// </summary>
public class SimulationAudit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Author { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public int Score { get; set; }       // pourcentage 0-100
    public int TotalAnswered { get; set; }
    public int TotalOui { get; set; }
    public int TotalNon { get; set; }
    /// <summary>JSON sérialisé : Dictionary&lt;string, string&gt; (controlId → "yes"|"no")</summary>
    public string AnswersJson { get; set; } = "{}";
    /// <summary>JSON sérialisé : Dictionary&lt;string, string&gt; (controlId → commentaire)</summary>
    public string CommentsJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}