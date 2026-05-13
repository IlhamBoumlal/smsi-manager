namespace backend.Domain.Entities
{
    public class UserPermissionOverride
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public int SocieteId { get; set; }
        public string ModuleId { get; set; } = string.Empty;
        public string ActionId { get; set; } = string.Empty;
        public bool IsGranted { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ApplicationUser User { get; set; } = null!;
        public Societe Societe { get; set; } = null!;
        public Module Module { get; set; } = null!;
        public Action Action { get; set; } = null!;
    }
}
