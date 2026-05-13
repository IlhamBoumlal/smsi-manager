namespace backend.Domain.Entities
{
    public class UserActivityLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int SocieteId { get; set; }
        public string? UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public string ModuleCode { get; set; } = string.Empty;
        public string ActionCode { get; set; } = string.Empty;
        public string HttpMethod { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string? QueryString { get; set; }
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public int StatusCode { get; set; }
        public string? Description { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Societe Societe { get; set; } = null!;
    }
}
