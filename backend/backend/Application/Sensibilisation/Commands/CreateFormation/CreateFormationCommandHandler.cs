// Application/Sensibilisation/Commands/CreateFormation/CreateFormationCommandHandler.cs
using MediatR;
using backend.Domain.Entities;
using backend.Infrastructure.Repositories;
using backend.Infrastructure.Services;
using backend.Domain.Interfaces;

namespace backend.Application.Sensibilisation.Commands.CreateFormation;

public class CreateFormationCommandHandler(
    IFormationRepository repo,
    IEmailServiceSens emailService)
    : IRequestHandler<CreateFormationCommand, Guid>
{
    public async Task<Guid> Handle(CreateFormationCommand cmd, CancellationToken ct)
    {
        // Construire la DateTime complète
        var datePart = DateOnly.Parse(cmd.Date);
        var heurePart = TimeOnly.Parse(cmd.Heure);
        var dateDebut = datePart.ToDateTime(heurePart, DateTimeKind.Local).ToUniversalTime();

        var formation = Formation.Create(
            cmd.Title, cmd.Description, cmd.Objectif,
            cmd.Mode.ToMode(), dateDebut, cmd.Duree,
            cmd.Formateur, cmd.FormateurType.ToFormateurType(),
            cmd.Departement, cmd.Role,
            cmd.LmsLink, cmd.NotifInvit, cmd.NotifRappel,
            cmd.SocieteId);

        // Ajouter les participants
        foreach (var p in cmd.Participants)
        {
            formation.Participants.Add(
                FormationParticipant.Create(formation.Id, formation.SocieteId, p.FullName, p.Email, p.Department));
        }

        await repo.AddAsync(formation, ct);
        await repo.SaveChangesAsync(ct);
        // Envoi des invitations si demandé
        if (cmd.NotifInvit)
        {
            var notifTasks = formation.Participants.Select(p =>
                emailService.SendInvitationAsync(
                    p.Email, p.FullName,
                    formation.Title, formation.DateDebut,
                    formation.Duree, formation.Formateur,
                    formation.LmsLink, ct));

            await Task.WhenAll(notifTasks);

            // Enregistrer dans l'historique
            formation.Notifications.Add(
                FormationNotification.Create(
                    formation.Id,
                    formation.SocieteId,
                    "Invitation envoyée",
                    formation.Participants.Count));
        }

        return formation.Id;
    }
}
