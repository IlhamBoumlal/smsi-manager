// Application/Sensibilisation/Commands/UpdateFormation/UpdateFormationCommandHandler.cs
using MediatR;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Commands.UpdateFormation;

public class UpdateFormationCommandHandler(IFormationRepository repo)
    : IRequestHandler<UpdateFormationCommand, bool>
{
    public async Task<bool> Handle(UpdateFormationCommand cmd, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(cmd.Id, ct);
        if (f is null) return false;

        var datePart = DateOnly.Parse(cmd.Date);
        var heurePart = TimeOnly.Parse(cmd.Heure);
        var dateDebut = datePart.ToDateTime(heurePart, DateTimeKind.Local).ToUniversalTime();

        f.Update(
            cmd.Title, cmd.Description, cmd.Objectif,
            cmd.Mode.ToMode(), dateDebut, cmd.Duree,
            cmd.Formateur, cmd.FormateurType.ToFormateurType(),
            cmd.Departement, cmd.Role, cmd.LmsLink);

        await repo.SaveChangesAsync(ct);
        return true;
    }
}