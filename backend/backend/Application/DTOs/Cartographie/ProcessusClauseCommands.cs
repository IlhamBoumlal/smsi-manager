namespace Application.DTOs.Cartographie;

/// <summary>Command pour ajouter des clauses à un processus</summary>
public class AddClausesCommand
{
    /// <summary>ID du processus</summary>
    public Guid ProcessusId { get; set; }
    
    /// <summary>Liste des ID de clauses à ajouter</summary>
    public List<int> ClauseIds { get; set; } = new();
}

/// <summary>Command pour supprimer une clause d'un processus</summary>
public class RemoveClauseCommand
{
    /// <summary>ID du processus</summary>
    public Guid ProcessusId { get; set; }
    
    /// <summary>ID de la clause à supprimer</summary>
    public int ClauseId { get; set; }
}
