// Application/Sensibilisation/Commands/UploadFormationDocument/UploadFormationDocumentCommandHandler.cs
using MediatR;
using backend.Application.DTOs;
using backend.Domain.Entities;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Commands.UploadFormationDocument;

public class UploadFormationDocumentCommandHandler(IFormationRepository repo)
    : IRequestHandler<UploadFormationDocumentCommand, DocumentDto>
{
    private readonly string _root = Path.Combine("wwwroot", "uploads", "sensibilisation");

    // UploadFormationDocumentCommandHandler.cs — modifie le Handle
    public async Task<DocumentDto> Handle(
        UploadFormationDocumentCommand cmd, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(cmd.FormationId, cmd.SocieteId, ct)
            ?? throw new InvalidOperationException("Formation introuvable");

        Directory.CreateDirectory(_root);
        var safeName = Path.GetFileName(cmd.File.FileName);
        var storagePath = Path.Combine(_root, $"{Guid.NewGuid()}_{safeName}");

        await using var stream = File.Create(storagePath);
        await cmd.File.CopyToAsync(stream, ct);

        var ext = Path.GetExtension(safeName).ToLowerInvariant();
        var doc = FormationDocument.Create(
            f.Id, safeName,
            ext == ".pdf" ? "pdf" : "file",
            storagePath, cmd.File.Length);

        // ✅ On ajoute le document directement, sans toucher à f
        await repo.AddDocumentAsync(doc, ct);
        await repo.SaveChangesAsync(ct);

        var sizeMo = Math.Round(cmd.File.Length / 1_048_576.0, 1);
        return new DocumentDto
        {
            Id = doc.Id,
            Name = safeName,
            Type = doc.FileType,
            Meta = $"{sizeMo} Mo · {doc.UploadedAt:dd/MM/yyyy}",
        };
    }
}