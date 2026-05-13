namespace backend.Application.DTOs.Dashboard
{
    public class DashboardMonthlySnapshotDto
    {
        public Guid Id { get; set; }
        public DateTime MonthStartUtc { get; set; }
        public int GlobalConformity { get; set; }
        public int IncidentsCount { get; set; }
        public int AuditsCompleted { get; set; }
        public int PdcaCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpsertDashboardMonthlySnapshotRequest
    {
        public DateTime? MonthStartUtc { get; set; }
        public int GlobalConformity { get; set; }
        public int IncidentsCount { get; set; }
        public int AuditsCompleted { get; set; }
        public int PdcaCompleted { get; set; }
    }
}
