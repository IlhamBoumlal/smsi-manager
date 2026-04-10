using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    // ── CONFORMITY STATUS ─────────────────────────────────────────────────────
    public class ConformityStatus
    {
        public int Id { get; set; }
        public int IsoClauseId { get; set; }
        public string UserId { get; set; } = "";

        // "non-conforme" | "partiellement-conforme" | "conforme" | "non-applicable"
        [MaxLength(50)] public string Status { get; set; } = "non-conforme";
        public int Score { get; set; }
        public DateTime? LastAudit { get; set; }
        public DateTime? NextAudit { get; set; }
        [MaxLength(2000)] public string Comments { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public IsoClause? Clause { get; set; }
    }
}
