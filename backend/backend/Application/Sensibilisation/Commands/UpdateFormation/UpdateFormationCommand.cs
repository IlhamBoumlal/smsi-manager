// Application/Sensibilisation/Commands/UpdateFormation/UpdateFormationCommand.cs
using MediatR;

namespace backend.Application.Sensibilisation.Commands.UpdateFormation;

public record UpdateFormationCommand(
    Guid Id,
    string Title,
    string Description,
    string Objectif,
    string Mode,
    string Date,
    string Heure,
    string Duree,
    string Formateur,
    string FormateurType,
    string Departement,
    string Role,
    string? LmsLink
) : IRequest<bool>;