using backend.Application.DTOs.Controles;
using backend.Domain.Enumerations;
using MediatR;

namespace backend.Application.Controles.Commands.UpdateControle;

public record UpdateControleCommand(
    Guid Id,
    string Titre,
    string? Description,
    DomaineControle Domaine,
    bool Applicable,
    Statut Statut,
    // Applicabilité
    List<string>? RaisonsApplicabilite = null, // object pour accepter le JSON du front
    string? RaisonExclusion = null,
    // Évaluation
    string? JustificationConformite = null,
    string? Remarque = null,
    string? Preuves = null,
     // Plan d'action
     List<object>? Steps = null, // object pour accepter le tableau du front
    string? Priorite = null,
    StatutPlan? StatutPlan = null,
    string? ResponsablePlan = null,
    DateTime? DateEcheance = null,
    string? ModifierId = null,
    string? ModifierNom = null,
    int? SocieteId = null
) : IRequest<(bool Success, string? Error, ControleDto? Data)>;