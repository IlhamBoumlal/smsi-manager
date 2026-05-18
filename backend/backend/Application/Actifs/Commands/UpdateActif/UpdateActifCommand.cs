using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Enumerations;
using MediatR;
namespace backend.Application.Actifs.Commands.UpdateActif
{
    public record UpdateActifCommand(
        Guid Id,
        string Nom,
        string? Description,
        TypeActif Type,
        CategorieActif Categorie,
        ClassificationActif Classification,
        string? ProprietaireNom,
        int? SocieteId
    ) : IRequest<ActifResponseDto?>;
}