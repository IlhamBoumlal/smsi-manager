using backend.Application.DTOs.Controles;
using backend.Domain.Enumerations;
using MediatR;

namespace backend.Application.Controles.Commands.UpdateControle
{
    public record UpdateControleCommand(
    Guid Id,
    string Titre,
    string? Description,
    DomaineControle Domaine,
    bool Applicable,
    string? JustificationApplicabilite,
    Statut Statut,
    string? Preuves,
    string? Responsable,
    string? ReferenceDocument,
    string? RisquesAssocies
) : IRequest<(bool Success, string? Error, ControleDto? Data)>;
}
