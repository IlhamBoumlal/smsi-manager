using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record DeleteDocumentCommand(Guid ProcessusId, Guid DocumentId) : IRequest;

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand>
{
    private readonly IProcessusRepository _repo;
    public DeleteDocumentCommandHandler(IProcessusRepository repo) => _repo = repo;

    public async Task Handle(DeleteDocumentCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.ProcessusId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.ProcessusId} introuvable.");
        p.RemoveDocument(cmd.DocumentId);
        await _repo.SaveChangesAsync(ct);
    }
}