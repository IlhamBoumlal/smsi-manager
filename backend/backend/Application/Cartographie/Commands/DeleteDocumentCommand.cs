using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record DeleteDocumentCommand(
    Guid ProcessusId,
    Guid DocumentId,
    int? SocieteId,
    string CurrentUserId
) : IRequest;

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand>
{
    private readonly IProcessusRepository _repo;
    private readonly ICartographieDocumentationSyncService _documentationSync;

    public DeleteDocumentCommandHandler(
        IProcessusRepository repo,
        ICartographieDocumentationSyncService documentationSync)
    {
        _repo = repo;
        _documentationSync = documentationSync;
    }

    public async Task Handle(DeleteDocumentCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.ProcessusId, cmd.SocieteId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.ProcessusId} introuvable.");

        var deletedDocument = p.Documents.FirstOrDefault(d => d.Id == cmd.DocumentId)
            ?? throw new KeyNotFoundException($"Document {cmd.DocumentId} introuvable.");

        await _documentationSync.SyncOnDocumentRemovedAsync(p, deletedDocument, cmd.CurrentUserId, ct);
        p.RemoveDocument(cmd.DocumentId);
        await _repo.SaveChangesAsync(ct);
    }
}
