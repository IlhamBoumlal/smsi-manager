namespace Application.DTOs.Cartographie;

/// <summary>DTO extendido para Processus avec clauses et contrôles associés</summary>
public record ProcessusDetailDto(
    Guid Id,
    string Categorie,
    string Nom,
    string Responsable,
    string Description,
    List<string> IsoReferences,
    List<DocumentDto> Documents,
    List<ControleAssocieDto> Controles,
    List<ClauseAssocieeDto> Clauses
);
