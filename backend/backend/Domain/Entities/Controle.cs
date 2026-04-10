using backend.Domain.Enumerations;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Domain.Entities;

public class Controle
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(10)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string Titre { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DomaineControle Domaine { get; set; }

    // ─── Applicabilité ───────────────────────────────────────────────────────
    public bool Applicable { get; set; } = true;

    // Stocké en JSON (ex: ["attenuation","legale"])
    public String? RaisonsApplicabilite { get; set; }

    public string? RaisonExclusion { get; set; }

    // ─── Évaluation ──────────────────────────────────────────────────────────
    [Required]
    public Statut Statut { get; set; } = Statut.NonEvalue;

    // Conforme : justification texte
    public string? JustificationConformite { get; set; }

    // Remarque : observation texte
    public string? Remarque { get; set; }

    // Preuves / documents joints (Conforme et Remarque)
    public string? Preuves { get; set; }

    // ─── Plan d'action (NC Mineure / NC Majeure) ──────────────────────────────
    // Stocké en JSON (tableau d'étapes sérialisé via PlanActionModal)
    public string? Steps { get; set; }

    public string? Priorite { get; set; }

    public StatutPlan? StatutPlan { get; set; }

    public string? ResponsablePlan { get; set; }

    public DateTime? DateEcheance { get; set; }

    // ─── Traçabilité ──────────────────────────────────────────────────────────
    public DateTime? DateMiseAJour { get; set; }
    public string? DernierModificateurId { get; set; }
    public string? DernierModificateurNom { get; set; }
}
