// Application/Sensibilisation/Commands/NotifyParticipants/NotifyParticipantsCommandHandler.cs
using MediatR;
using backend.Domain.Entities;
using backend.Infrastructure.Repositories;
using backend.Infrastructure.Services;
using backend.Domain.Interfaces;

namespace backend.Application.Sensibilisation.Commands.NotifyParticipants;

public class NotifyParticipantsCommandHandler(
    IFormationRepository repo,
    IEmailServiceSens emailService)
    : IRequestHandler<NotifyParticipantsCommand, bool>
{
    public async Task<bool> Handle(NotifyParticipantsCommand cmd, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(cmd.FormationId, cmd.SocieteId, ct);
        if (f is null) return false;

        // Envoi email à chaque participant
        var isRappel = cmd.NotifTitle.Contains("Rappel", StringComparison.OrdinalIgnoreCase);
        var tasks = f.Participants.Select(p =>
            isRappel
                ? emailService.SendRappelAsync(p.Email, p.FullName, f.Title, f.DateDebut, ct)
                : emailService.SendInvitationAsync(
                    p.Email, p.FullName, f.Title, f.DateDebut,
                    f.Duree, f.Formateur, f.LmsLink, ct));

        await Task.WhenAll(tasks);

        // Historique
        f.Notifications.Add(
            FormationNotification.Create(f.Id, f.SocieteId, cmd.NotifTitle, f.Participants.Count));

        await repo.SaveChangesAsync(ct);
        return true;
    }
}
