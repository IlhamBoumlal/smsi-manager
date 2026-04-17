// Application/Sensibilisation/Commands/DeleteFormation/DeleteFormationCommandHandler.cs
using MediatR;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Commands.DeleteFormation;

public class DeleteFormationCommandHandler(IFormationRepository repo)
    : IRequestHandler<DeleteFormationCommand, bool>
{
    public async Task<bool> Handle(DeleteFormationCommand cmd, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(cmd.Id, ct);
        if (f is null) return false;

        // Supprimer les fichiers physiques associés
        foreach (var doc in f.FormationDocuments)
            if (File.Exists(doc.StoragePath))
                File.Delete(doc.StoragePath);

        repo.Remove(f); // ← CORRECTION : marquer la formation pour suppression EF Core
        await repo.SaveChangesAsync(ct);
        return true;
    }
}