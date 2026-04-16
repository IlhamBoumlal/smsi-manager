namespace backend.Domain.Entities
{
    public class RiskStudy
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public int? SocieteId { get; set; }
        public Societe? Societe { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Organization { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Perimeter { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string PayloadJson { get; set; } = "{}";
        public string? CreatedByUserId { get; set; }
        public ApplicationUser? CreatedByUser { get; set; }
        public string? LastModifiedByUserId { get; set; }
        public ApplicationUser? LastModifiedByUser { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
