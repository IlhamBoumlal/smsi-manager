namespace Application.DTOs.Cartographie;

public record ProcessusDto(
    Guid Id,
    string Categorie,
    string Nom,
    string Responsable,
    string Description,
    List<DocumentDto> Documents
);
