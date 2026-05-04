// Application/Sensibilisation/Commands/UpdateParticipantStatus/UpdateParticipantStatusCommand.cs
using MediatR;

namespace backend.Application.Sensibilisation.Commands.UpdateParticipantStatus;

public record UpdateParticipantStatusCommand(
    Guid FormationId,
    Guid ParticipantId,
    string Status,   // "Invité" | "Présent"
    int? SocieteId
) : IRequest<bool>;