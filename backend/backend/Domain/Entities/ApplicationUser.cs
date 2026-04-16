<<<<<<< HEAD
using backend.Domain.Entities;
=======
﻿using backend.Domain.Entities;
>>>>>>> meriem
using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
<<<<<<< HEAD
    public string NomComplet { get; set; } = string.Empty;

    public int? SocieteId { get; set; }
=======
    public string NomComplet { get; set; }

    public int? SocieteId { get; set; }  
>>>>>>> meriem
    public Societe? Societe { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}