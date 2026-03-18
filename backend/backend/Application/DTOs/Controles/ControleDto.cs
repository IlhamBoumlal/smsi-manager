using backend.Domain.Enumerations;

namespace backend.Application.DTOs.Controles
{
    public record ControleDto(
    Guid Id,
    string Code,
    string Titre,
    string? Description,
    DomaineControle Domaine,
    bool Applicable,
    string? JustificationApplicabilite,
    Statut Statut,
    string? Preuves,
    string? Responsable,
    string? ReferenceDocument,
    DateTime? DateMiseAJour
);
}
