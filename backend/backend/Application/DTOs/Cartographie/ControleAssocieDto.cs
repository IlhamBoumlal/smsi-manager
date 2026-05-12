namespace Application.DTOs.Cartographie;

/// <summary>DTO pour les contrôles associés à un processus</summary>
public record ControleAssocieDto(
    Guid Id,
    string Code,
    string Titre,
    string? Description,
    string Domaine,
    string Statut,
    string? Justification,
    DateTime AssociatedAt
);
