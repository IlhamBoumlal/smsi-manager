using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Enumerations;
using MediatR;

namespace backend.Application.Actifs.Commands.CreateActif
{
    public record CreateActifCommand(
     string Nom,
     string? Description,
     TypeActif Type,
     CategorieActif Categorie,
     ClassificationActif Classification,
     Guid ProprietaireId
 ) : IRequest<ActifResponseDto>;
}
