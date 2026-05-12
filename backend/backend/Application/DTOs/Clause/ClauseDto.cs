using System.Text.Json.Serialization;

namespace Application.DTOs.Clause
{
    // ── ISO CLAUSE ─────────────────────────────────────────────────────────────
    public class IsoClauseDto
    {
        public int Id { get; set; }
        public string Number { get; set; } = "";
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public int? ParentId { get; set; }
        public List<IsoClauseDto> SubClauses { get; set; } = new();
    }

    // ── CONFORMITY ─────────────────────────────────────────────────────────────
    public class ConformityStatusDto
    {
        public int Id { get; set; }
        public int IsoClauseId { get; set; }
        // Seuls deux statuts sont stockés en base :
        // "non-conforme" | "conforme"
        // L'état "non évalué" est implicite (absence d'enregistrement, null côté frontend)
        public string Status { get; set; } = "non-conforme";
        public int Score { get; set; }
        public string? LastAudit { get; set; }
        public string? NextAudit { get; set; }
        public string Comments { get; set; } = "";
        public string UpdatedAt { get; set; } = "";
    }

    public class UpsertConformityDto
    {
        public int SubClauseId { get; set; }
        // "non-conforme" | "conforme"
        public string Status { get; set; } = "non-conforme";
        public int Score { get; set; }
        public string? LastAudit { get; set; }
        public string? NextAudit { get; set; }
        public string Comments { get; set; } = "";
    }

    // ── ACTION PLAN ────────────────────────────────────────────────────────────

    // Étape imbriquée (stockée en JSON dans ActionPlan)
    public class EtapeDto
    {
        public int Ordre { get; set; }
        public string Description { get; set; } = "";
        public string Responsable { get; set; } = "";
        public string Echeance { get; set; } = "";
        // "non-demarree" | "en-cours" | "terminee"
        public string Statut { get; set; } = "non-demarree";
    }

    public class PieceJointeDto
    {
        public string Nom { get; set; } = "";
        public string Type { get; set; } = "";
        public string DateAjout { get; set; } = "";
    }

    public class EnjeuxDto
    {
        public string Domaine { get; set; } = "";
        public string Enjeu { get; set; } = "";
        // "faible" | "moyen" | "élevé" | "critique"
        public string NiveauImpact { get; set; } = "moyen";
        public string MesureAssociee { get; set; } = "";
    }

    public class ActionPlanDto
    {
        public int Id { get; set; }
        public Guid GuidId { get; set; }
        public int IsoClauseId { get; set; }

        // ── NOUVEAU : référence à la sous-clause concernée ────────────────────
        public int? SubClauseId { get; set; }

        // Section 1
        public string Reference { get; set; } = "";
        public string Version { get; set; } = "1.0";
        public string DateDetection { get; set; } = "";
        public string SourceDetection { get; set; } = "";
        public string ClauseIso { get; set; } = "";
        public string Gravite { get; set; } = "mineure";
        public string DescriptionNc { get; set; } = "";
        public Dictionary<string, string>? SpecificFields { get; set; }

        // Section 2
        public string ResponsableImmediat { get; set; } = "";
        public string MesureImmediate { get; set; } = "";
        public List<string> PreuvesImmediates { get; set; } = new();

        // Section 3
        public string AnalyseCausesRacines { get; set; } = "";
        public string CausePrincipale { get; set; } = "";
        public List<string> CausesSecondaires { get; set; } = new();

        // Section 4
        public string DocumentAProduire { get; set; } = "";
        public string PeriodiciteRevision { get; set; } = "";
        public List<EnjeuxDto> EnjeuxInternes { get; set; } = new();
        public List<EnjeuxDto> EnjeuxExternes { get; set; } = new();
        public List<EtapeDto> EtapesPlanAction { get; set; } = new();
        public string? DateEcheanceGlobale { get; set; }
        public string ResponsablePlan { get; set; } = "";
        public string RessourcesNecessaires { get; set; } = "";

        // Section 5
        public List<string> MethodesVerification { get; set; } = new();
        public string? DateVerification { get; set; }
        public string ResultatsObtenus { get; set; } = "";
        public List<PieceJointeDto> PiecesJointes { get; set; } = new();

        // Section 6
        public string Statut { get; set; } = "ouverte";
        public bool PlanCloture { get; set; } = false;
        public string? DateCloture { get; set; }
        public string? Validateur { get; set; }

        public string CreatedAt { get; set; } = "";
        public string UpdatedAt { get; set; } = "";
    }

    public class CreateActionPlanDto
    {
        public int IsoClauseId { get; set; }

        // ── NOUVEAU : référence à la sous-clause concernée ────────────────────
        public int? SubClauseId { get; set; }

        public string Reference { get; set; } = "";
        public string Version { get; set; } = "1.0";
        public string DateDetection { get; set; } = "";
        public string SourceDetection { get; set; } = "";
        public string ClauseIso { get; set; } = "";
        public string Gravite { get; set; } = "mineure";
        public string DescriptionNc { get; set; } = "";
        public Dictionary<string, string>? SpecificFields { get; set; }
        public string ResponsableImmediat { get; set; } = "";
        public string MesureImmediate { get; set; } = "";
        public List<string> PreuvesImmediates { get; set; } = new();
        public string AnalyseCausesRacines { get; set; } = "";
        public string CausePrincipale { get; set; } = "";
        public List<string> CausesSecondaires { get; set; } = new();
        public string DocumentAProduire { get; set; } = "";
        public string PeriodiciteRevision { get; set; } = "";
        public List<EnjeuxDto> EnjeuxInternes { get; set; } = new();
        public List<EnjeuxDto> EnjeuxExternes { get; set; } = new();
        public List<EtapeDto> EtapesPlanAction { get; set; } = new();
        public string? DateEcheanceGlobale { get; set; }
        public string ResponsablePlan { get; set; } = "";
        public string RessourcesNecessaires { get; set; } = "";
        public List<string> MethodesVerification { get; set; } = new();
        public string? DateVerification { get; set; }
        public string ResultatsObtenus { get; set; } = "";
        public List<PieceJointeDto> PiecesJointes { get; set; } = new();
        public string Statut { get; set; } = "ouverte";
        public bool PlanCloture { get; set; } = false;
        public string? DateCloture { get; set; }
        public string? Validateur { get; set; }
    }

    public class UpdateActionPlanDto : CreateActionPlanDto { }

    // ── DASHBOARD DTO ──────────────────────────────────────────────────────────
    public class ClauseDashboardDto
    {
        public IsoClauseDto Clause { get; set; } = new();
        public int ComputedScore { get; set; }
        public bool IsFullyCompliant { get; set; }
        public Dictionary<int, ConformityStatusDto> SubConformities { get; set; } = new();
        public int ActionCount { get; set; }
        public int DoneCount { get; set; }
        public int InProgress { get; set; }
    }

    public class GlobalStatsDto
    {
        public int TotalClauses { get; set; }
        public double AverageConformity { get; set; }
        public int ConformeClauses { get; set; }
        public int PartialClauses { get; set; }
        public int NonConformeClauses { get; set; }
        public int TotalActions { get; set; }
        public int CompletedActions { get; set; }
        public int InProgressActions { get; set; }
        public int DelayedActions { get; set; }
    }
}