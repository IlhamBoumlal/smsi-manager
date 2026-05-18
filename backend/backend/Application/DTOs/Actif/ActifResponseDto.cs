using backend.Domain.Enumerations;
namespace backend.Application.DTOs.ActifDTOs
{
    public record ActifResponseDto(
        Guid Id,
        string Nom,
        string Description,
        TypeActif Type,
        CategorieActif Categorie,
        ClassificationActif Classification,
        string? ProprietaireNom
    );
}