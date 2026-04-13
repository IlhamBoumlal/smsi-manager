using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    // ── CLAUSE (référentiel ISO 27001, prédéfini) ─────────────────────────────
    public class IsoClause
    {
        public int Id { get; set; }
        [MaxLength(10)] public string Number { get; set; } = "";
        [MaxLength(200)] public string Title { get; set; } = "";
        [MaxLength(2000)] public string Description { get; set; } = "";
        public int? ParentId { get; set; }

        [ForeignKey("ParentId")]
        public IsoClause? Parent { get; set; }

        // Sous-clauses enfants (relation auto-référentielle)
        public List<IsoClause> SubClauses { get; set; } = new();

        // Conformités rattachées à cette clause
        public List<ConformityStatus> Conformities { get; set; } = new();

        // Plans d'action dont cette clause est la CLAUSE PARENTE (IsoClauseId)
        // La relation SubClause (SubClauseId) n'a PAS de collection inverse ici —
        // elle est configurée avec .WithMany() sans paramètre dans AppDbContext.
        public List<ActionPlan> ActionPlans { get; set; } = new();
    }
}