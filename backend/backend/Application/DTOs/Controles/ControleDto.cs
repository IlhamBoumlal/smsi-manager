using backend.Domain.Enumerations;


namespace backend.Application.DTOs.Controles
{
    public class ControleDto
{
    public Guid Id { get; init; }

    public required string Code { get; init; }

    public required string Titre { get; init; }

    public string? Description { get; init; }

    public DomaineControle Domaine { get; init; }

    // ─── Applicabilité ───────────────────────────────────────────────────────
    public bool Applicable { get; init; }

    // JSON string (ex: ["attenuation","legale"])
    public List<string>? RaisonsApplicabilite { get; init; }

    public string? RaisonExclusion { get; init; }

    // ─── Évaluation ──────────────────────────────────────────────────────────
    public Statut Statut { get; init; }

    public string? JustificationConformite { get; init; }

    public string? Remarque { get; init; }

    public string? Preuves { get; init; }

    // ─── Plan d'action (NC Mineure / NC Majeure) ──────────────────────────────
    // JSON string (tableau d'étapes)
    public object? Steps { get; init; }

    public string? Priorite { get; init; }

    // Enum sérialisé en string : "NonDemarre" | "EnCours" | "Termine"
    public StatutPlan? StatutPlan { get; init; }

    public string? ResponsablePlan { get; init; }

    // yyyy-MM-dd
    public DateTime? DateEcheance { get; init; }

    // Traçabilité
    public DateTime? DateMiseAJour { get; init; }
    public string? DernierModificateurId { get; init; }
    public string? DernierModificateurNom { get; init; }
  
} 
}