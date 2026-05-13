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
        public StatutIncident? Statut { get; set; }
        public string? Resolution { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ClosedAt { get; set; }

        public int? SocieteId { get; set; }
        public Societe? Societe { get; set; }
    }
}
