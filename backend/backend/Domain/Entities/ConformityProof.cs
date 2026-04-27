using System.ComponentModel.DataAnnotations;

namespace backend.Domain.Entities
{
    /// <summary>
    /// Enregistrement d'une preuve de conformité pour une sous-clause.
    /// Une sous-clause conforme peut avoir 0..N preuves.
    /// </summary>
    public class ConformityProof
    {
        public int Id { get; set; }

        public int IsoClauseId { get; set; }  // sous-clause concernée
        public int? SocieteId { get; set; }
        public string UserId { get; set; } = "";

        [MaxLength(500)] public string Description { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // ── NAVIGATION ────────────────────────────────────────────────────────
        public IsoClause? Clause { get; set; }
        public Societe? Societe { get; set; }
        public List<FileAttachment> Files { get; set; } = new();
    }
}