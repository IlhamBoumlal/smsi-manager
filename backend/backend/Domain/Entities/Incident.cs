using backend.Domain.Enumerations;

namespace backend.Domain.Entities
{
    public class Incident
    {
        public Guid Id { get; init; }
        public string? Titre { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public DateTime? Date { get; set; }
        public PrioriteIncident? Priorite { get; set; }
        public string? Declarant { get; set; }
        public StatutIncident? Statut { get; set; }
        public string? Resolution { get; set; }
    }
}
