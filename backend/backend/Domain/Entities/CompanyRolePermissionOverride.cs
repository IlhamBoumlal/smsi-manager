namespace backend.Domain.Entities
{
    public class CompanyRolePermissionOverride
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int SocieteId { get; set; }
        public string RoleKey { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
        public string ActionId { get; set; } = string.Empty;
        public bool IsGranted { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Societe Societe { get; set; } = null!;
        public Module Module { get; set; } = null!;
        public Action Action { get; set; } = null!;
    }
}
