using Application.DTOs.Cartographie;
using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record AddDocumentCommand(
    Guid ProcessusId,
    string Nom,
    string Type,
    string Reference,
    string Statut,
    string? FichierNom,
    string? FichierType,
    byte[]? FichierData,
    int? SocieteId
) : IRequest<DocumentDto>;

public class AddDocumentCommandHandler : IRequestHandler<AddDocumentCommand, DocumentDto>
{
    private readonly IProcessusRepository _repo;
    public AddDocumentCommandHandler(IProcessusRepository repo) => _repo = repo;

    public async Task<DocumentDto> Handle(AddDocumentCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.ProcessusId, cmd.SocieteId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.ProcessusId} introuvable.");

        var doc = p.AddDocument(cmd.Nom, cmd.Type, cmd.Reference, cmd.Statut,
                                cmd.FichierNom, cmd.FichierType, cmd.FichierData);

        await _repo.AddDocumentAsync(doc, ct);
        await _repo.SaveChangesAsync(ct);

        return new DocumentDto(doc.Id, doc.Nom, doc.Type, doc.Reference,
                               doc.Statut, doc.FichierNom, doc.FichierType,
                               doc.FichierData != null);
    }
}