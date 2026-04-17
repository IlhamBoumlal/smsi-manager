// Application/Sensibilisation/Commands/DeleteFormationDocument/DeleteFormationDocumentCommandHandler.cs
using MediatR;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Commands.DeleteFormationDocument;

public class DeleteFormationDocumentCommandHandler(IFormationRepository repo)
    : IRequestHandler<DeleteFormationDocumentCommand, bool>
{
    public async Task<bool> Handle(DeleteFormationDocumentCommand cmd, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(cmd.FormationId, ct);
        if (f is null) return false;

        var doc = f.FormationDocuments.FirstOrDefault(d => d.Id == cmd.DocumentId);
        if (doc is null) return false;

        if (File.Exists(doc.StoragePath))
            File.Delete(doc.StoragePath);

        repo.RemoveDocument(doc);   // ← via DbSet, pas via collection
        await repo.SaveChangesAsync(ct);

        return true;

    }
}