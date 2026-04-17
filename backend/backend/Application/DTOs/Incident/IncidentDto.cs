namespace backend.Application.DTOs.Incident
{
  
    using global::backend.Domain.Enumerations;

    namespace backend.Application.Dtos
    {
        public class IncidentDto
        {
            // Pour la création : pas d'Id (généré côté serveur)
            // Pour la réponse : Id présent
            public Guid? Id { get; init; }

            public string Titre { get; init; } = string.Empty;
            public string? Description { get; init; }

            // Date sera ignorée en création/mise à jour (générée auto)
            public DateTime? Date { get; init; }

            public PrioriteIncident? Priorite { get; init; }
            public StatutIncident? Statut { get; init; }
            public string? Resolution { get; init; }
        }
    }
}
