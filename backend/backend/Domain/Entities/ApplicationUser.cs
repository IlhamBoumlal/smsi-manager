using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    public string NomComplet { get; set; } = string.Empty;

    public int? SocieteId { get; set; }

    public Societe? Societe { get; set; }

    // SUPER_ADMIN | ADMIN_SOCIETE | RSSI | CONSULTANT | AUDITEUR
    public string PrimaryRoleKey { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}
