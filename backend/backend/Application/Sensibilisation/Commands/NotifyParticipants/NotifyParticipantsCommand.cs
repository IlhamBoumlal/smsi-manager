// Application/Sensibilisation/Commands/NotifyParticipants/NotifyParticipantsCommand.cs
using MediatR;

namespace backend.Application.Sensibilisation.Commands.NotifyParticipants;

public record NotifyParticipantsCommand(
    Guid FormationId,
    string NotifTitle,  // "Invitation envoyée" | "Rappel 48h avant" | texte libre
    int? SocieteId
) : IRequest<bool>;