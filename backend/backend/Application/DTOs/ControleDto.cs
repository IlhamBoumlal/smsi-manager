using backend.Domain.Enumerations;

namespace backend.Application.DTOs
{
    public class ControleDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Titre { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DomaineControle Domaine { get; set; }
        public bool Applicable { get; set; }
        public string JustificationApplicabilite { get; set; } = string.Empty;
        public Statut Statut { get; set; }
        public string JustificationConformite { get; set; } = string.Empty;
        public string Remarque { get; set; } = string.Empty;
        public string PlanCorrectif { get; set; } = string.Empty;
        public string ResponsablePlan { get; set; } = string.Empty;
        public DateTime? DateEcheance { get; set; }
        public string Preuves { get; set; } = string.Empty;
        public string Responsable { get; set; } = string.Empty;
        public string ReferenceDocument { get; set; } = string.Empty;
        public DateTime DateMiseAJour { get; set; }
        public int? SocieteId { get; set; }
    }
}
