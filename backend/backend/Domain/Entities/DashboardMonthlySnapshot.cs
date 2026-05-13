namespace backend.Domain.Entities
{
    public class DashboardMonthlySnapshot
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public int? SocieteId { get; set; }
        public Societe? Societe { get; set; }
        public DateTime MonthStartUtc { get; set; }
        public int GlobalConformity { get; set; }
        public int IncidentsCount { get; set; }
        public int AuditsCompleted { get; set; }
        public int PdcaCompleted { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
