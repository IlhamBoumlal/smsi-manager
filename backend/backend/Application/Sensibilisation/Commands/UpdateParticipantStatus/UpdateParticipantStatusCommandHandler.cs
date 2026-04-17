// Application/Sensibilisation/Commands/UpdateParticipantStatus/UpdateParticipantStatusCommandHandler.cs
using MediatR;
using backend.Domain.Enumerations;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Commands.UpdateParticipantStatus;

public class UpdateParticipantStatusCommandHandler(IFormationRepository repo)
    : IRequestHandler<UpdateParticipantStatusCommand, bool>
{
    public async Task<bool> Handle(UpdateParticipantStatusCommand cmd, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(cmd.FormationId, ct);
        if (f is null) return false;

        var p = f.Participants.FirstOrDefault(x => x.Id == cmd.ParticipantId);
        if (p is null) return false;

        p.Status = cmd.Status == "Présent"
            ? ParticipantStatus.Present
            : ParticipantStatus.Invite;

        // Auto-passage En cours si premier présent
        if (p.Status == ParticipantStatus.Present
            && f.Status == FormationStatus.Planifiee)
            f.SetStatus(FormationStatus.EnCours);

        await repo.SaveChangesAsync(ct);
        return true;
    }
}