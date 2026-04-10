using backend.Domain.Enumerations;

namespace backend.Application.DTOs
{
    public class ControleDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; }
        public string Titre { get; set; }
        public string Description { get; set; }
        public DomaineControle Domaine { get; set; }
        public bool Applicable { get; set; }
        public string JustificationApplicabilite { get; set; }
        public Statut Statut { get; set; }
        public string JustificationConformite { get; set; }
        public string Remarque { get; set; }
        public string PlanCorrectif { get; set; }
        public string ResponsablePlan { get; set; }
        public DateTime? DateEcheance { get; set; }
        public string Preuves { get; set; }
        public string Responsable { get; set; }
        public string ReferenceDocument { get; set; }
        public DateTime DateMiseAJour { get; set; }
        public int? SocieteId { get; set; }
    }
}

