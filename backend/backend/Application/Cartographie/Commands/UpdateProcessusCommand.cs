using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record UpdateProcessusCommand(
    Guid Id,
    string Categorie,
    string Nom,
    string Responsable,
    string Description,
    int? SocieteId,
    string CurrentUserId
) : IRequest;

public class UpdateProcessusCommandHandler : IRequestHandler<UpdateProcessusCommand>
{
    private readonly IProcessusRepository _repo;
    private readonly ICartographieDocumentationSyncService _documentationSync;

    public UpdateProcessusCommandHandler(
        IProcessusRepository repo,
        ICartographieDocumentationSyncService documentationSync)
    {
        _repo = repo;
        _documentationSync = documentationSync;
    }

    public async Task Handle(UpdateProcessusCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.Id, cmd.SocieteId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.Id} introuvable.");
        var previousName = p.Nom;
        p.Update(cmd.Categorie, cmd.Nom, cmd.Responsable, cmd.Description);
        await _repo.SaveChangesAsync(ct);

        await _documentationSync.SyncOnProcessusRenamedAsync(
            previousName,
            cmd.Nom,
            cmd.SocieteId,
            cmd.CurrentUserId,
            ct);
    }
}
