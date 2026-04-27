using System.ComponentModel.DataAnnotations;

namespace backend.Domain.Entities
{
    /// <summary>
    /// Pièce jointe dont le contenu binaire est stocké directement en base de données.
    /// Pas de système de fichiers requis — fonctionne sur tout hébergement stateless.
    ///
    /// Lié soit à une ConformityProof (preuve de conformité),
    /// soit à un ActionPlan (document justificatif).
    /// </summary>
    public class FileAttachment
    {
        public int Id { get; set; }

        public int? SocieteId { get; set; }
        public string UserId { get; set; } = "";

        // ── LIENS (l'un ou l'autre est renseigné) ────────────────────────────
        public int? ConformityProofId { get; set; }
        public int? ActionPlanId { get; set; }

        // ── MÉTADONNÉES ───────────────────────────────────────────────────────
        [MaxLength(255)] public string OriginalName { get; set; } = "";
        [MaxLength(100)] public string ContentType { get; set; } = "";
        public long FileSize { get; set; }
        [MaxLength(200)] public string? Description { get; set; }

        // ── CONTENU BINAIRE ───────────────────────────────────────────────────
        // SQL Server  → varbinary(max)
        // PostgreSQL  → bytea
        // SQLite      → BLOB
        public byte[] Content { get; set; } = Array.Empty<byte>();

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // ── NAVIGATION ────────────────────────────────────────────────────────
        public ConformityProof? ConformityProof { get; set; }
        public ActionPlan? ActionPlan { get; set; }
        public Societe? Societe { get; set; }
    }
}