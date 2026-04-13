using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    public string NomComplet { get; set; } = string.Empty;

    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}