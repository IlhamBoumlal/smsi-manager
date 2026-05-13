using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record DeleteProcessusCommand(Guid Id, int? SocieteId, string CurrentUserId) : IRequest;

public class DeleteProcessusCommandHandler : IRequestHandler<DeleteProcessusCommand>
{
    private readonly IProcessusRepository _repo;
    private readonly ICartographieDocumentationSyncService _documentationSync;

    public DeleteProcessusCommandHandler(
        IProcessusRepository repo,
        ICartographieDocumentationSyncService documentationSync)
    {
        _repo = repo;
        _documentationSync = documentationSync;
    }

    public async Task Handle(DeleteProcessusCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.Id, cmd.SocieteId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.Id} introuvable.");

        foreach (var linkedDoc in p.Documents.ToList())
        {
            await _documentationSync.SyncOnDocumentRemovedAsync(p, linkedDoc, cmd.CurrentUserId, ct);
        }

        _repo.Remove(p);
        await _repo.SaveChangesAsync(ct);
    }
}
