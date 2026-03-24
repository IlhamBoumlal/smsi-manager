using backend.Domain.Enumerations;

namespace backend.Application.DTOs.ActifDTOs
{
    public record UpdateActifDto(
       string Nom,
       string Description,
       TypeActif Type,
       CategorieActif Categorie,
       ClassificationActif Classification,
       Guid ProprietaireId
   );
}
