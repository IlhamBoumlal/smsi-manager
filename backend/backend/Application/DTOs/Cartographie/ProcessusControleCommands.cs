namespace Application.DTOs.Cartographie;

/// <summary>Command pour ajouter des contrôles à un processus</summary>
public class AddControlesCommand
{
    /// <summary>ID du processus</summary>
    public Guid ProcessusId { get; set; }
    
    /// <summary>Liste des ID de contrôles à ajouter</summary>
    public List<Guid> ControleIds { get; set; } = new();
}

/// <summary>Command pour supprimer un contrôle d'un processus</summary>
public class RemoveControleCommand
{
    /// <summary>ID du processus</summary>
    public Guid ProcessusId { get; set; }
    
    /// <summary>ID du contrôle à supprimer</summary>
    public Guid ControleId { get; set; }
}
