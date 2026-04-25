namespace backend.Domain.Entities
{
    public class Module
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Code { get; set; } = string.Empty; // dashboard, users, roles, etc.
        public string Name { get; set; } = string.Empty; // Tableau De Bord, Utilisateurs, etc.
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    }
}
