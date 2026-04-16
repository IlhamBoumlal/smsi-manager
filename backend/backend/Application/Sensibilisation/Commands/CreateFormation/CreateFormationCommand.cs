// Application/Sensibilisation/Commands/CreateFormation/CreateFormationCommand.cs
using MediatR;

namespace backend.Application.Sensibilisation.Commands.CreateFormation;

public record CreateFormationCommand(
    string Title,
    string Description,
    string Objectif,
    string Mode,           // "Présentiel" | "Distanciel" | "E-learning"
    string Date,           // "yyyy-MM-dd"
    string Heure,          // "HH:mm"
    string Duree,
    string Formateur,
    string FormateurType,  // "Interne" | "Externe"
    string Departement,
    string Role,
    string? LmsLink,
    bool NotifInvit,
    bool NotifRappel,
    // Participants nommés avec emails (saisis dans le formulaire)
    List<ParticipantInput> Participants,
    Guid? SocieteId
) : IRequest<Guid>;

public record ParticipantInput(string FullName, string Email, string Department);