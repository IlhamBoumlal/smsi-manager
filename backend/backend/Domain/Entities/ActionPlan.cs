using System.ComponentModel.DataAnnotations;

namespace backend.Domain.Entities
{
    public class ActionPlan
    {
        public int Id { get; set; }
        public Guid GuidId { get; set; } = Guid.NewGuid();
        public int IsoClauseId { get; set; }
        public int? SocieteId { get; set; }

        // ── NOUVEAU : lien vers la sous-clause concernée ──────────────────────
        public int? SubClauseId { get; set; }

        public string UserId { get; set; } = "";

        // Section 1 – Identification NC
        [MaxLength(50)] public string Reference { get; set; } = "";
        [MaxLength(20)] public string Version { get; set; } = "1.0";
        public DateTime DateDetection { get; set; } = DateTime.UtcNow;
        [MaxLength(200)] public string SourceDetection { get; set; } = "";
        [MaxLength(20)] public string ClauseIso { get; set; } = "";
        // "mineure" | "majeure"
        [MaxLength(20)] public string Gravite { get; set; } = "mineure";
        [MaxLength(4000)] public string DescriptionNc { get; set; } = "";

        // Champs spécifiques (JSON sérialisé)
        [MaxLength(8000)] public string? SpecificFieldsJson { get; set; }

        // Section 2 – Action immédiate
        [MaxLength(200)] public string ResponsableImmediat { get; set; } = "";
        [MaxLength(4000)] public string MesureImmediate { get; set; } = "";
        [MaxLength(4000)] public string PreuvesImmediatesJson { get; set; } = "[]";

        // Section 3 – Causes
        [MaxLength(4000)] public string AnalyseCausesRacines { get; set; } = "";
        [MaxLength(2000)] public string CausePrincipale { get; set; } = "";
        [MaxLength(8000)] public string CausesSecondairesJson { get; set; } = "[]";

        // Section 4 – Correctif
        [MaxLength(200)] public string DocumentAProduire { get; set; } = "";
        [MaxLength(500)] public string PeriodiciteRevision { get; set; } = "";
        [MaxLength(8000)] public string EnjeuxInternesJson { get; set; } = "[]";
        [MaxLength(8000)] public string EnjeuxExternesJson { get; set; } = "[]";
        [MaxLength(16000)] public string EtapesPlanActionJson { get; set; } = "[]";
        public DateTime? DateEcheanceGlobale { get; set; }
        [MaxLength(200)] public string ResponsablePlan { get; set; } = "";
        [MaxLength(1000)] public string RessourcesNecessaires { get; set; } = "";

        // Section 5 – Vérification
        [MaxLength(8000)] public string MethodesVerificationJson { get; set; } = "[]";
        public DateTime? DateVerification { get; set; }
        [MaxLength(4000)] public string ResultatsObtenus { get; set; } = "";
        [MaxLength(8000)] public string PiecesJointesJson { get; set; } = "[]";

        // Section 6 – Clôture
        // "ouverte" | "en-cours" | "en-attente" | "terminee"
        [MaxLength(30)] public string Statut { get; set; } = "ouverte";
        public bool PlanCloture { get; set; } = false;
        public DateTime? DateCloture { get; set; }
        [MaxLength(200)] public string? Validateur { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public IsoClause? Clause { get; set; }
        public IsoClause? SubClause { get; set; }
        public Societe? Societe { get; set; }
        // In your ActionPlan entity class, add:
        public ICollection<PlanStep> PlanSteps { get; set; } = new List<PlanStep>();
    }
}