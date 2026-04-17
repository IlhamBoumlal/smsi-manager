namespace Application.DTOs.Cartographie;

public record DocumentDto(
    Guid Id,
    string Nom,
    string Type,
    string Reference,
    string Statut,
    string? FichierNom,
    string? FichierType,
    bool AFichier      // indique si un fichier est attaché, sans l'envoyer
);