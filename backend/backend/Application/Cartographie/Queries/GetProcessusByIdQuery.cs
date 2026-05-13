using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Queries;

public record GetProcessusByIdQuery(Guid Id, int? SocieteId) : IRequest<ProcessusDto?>;

public class GetProcessusByIdQueryHandler : IRequestHandler<GetProcessusByIdQuery, ProcessusDto?>
{
    private readonly IProcessusRepository _repo;
    public GetProcessusByIdQueryHandler(IProcessusRepository repo) => _repo = repo;

    public async Task<ProcessusDto?> Handle(GetProcessusByIdQuery request, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(request.Id, request.SocieteId, ct);
        if (p is null) return null;
        return new ProcessusDto(
            p.Id,
            p.Categorie,
            p.Nom,
            p.Responsable,
            p.Description,
            BuildIsoReferences(p),
            p.Documents.Select(d => new DocumentDto(d.Id, d.Nom, d.Type, d.Reference, d.Statut, d.FichierNom, d.FichierType, !string.IsNullOrEmpty(d.FichierNom))).ToList()
        );
    }

    private static List<string> BuildIsoReferences(Processus p)
    {
        var references = new List<string>();

        references.AddRange(p.ProcessusClauses
            .Where(pc => pc.Clause != null)
            .Select(pc => $"{pc.Clause!.Number} - {pc.Clause!.Title}"));

        references.AddRange(p.ProcessusControles
            .Where(pc => pc.Controle != null)
            .Select(pc => $"{pc.Controle!.Code} - {pc.Controle!.Titre}"));

        return references.Distinct().ToList();
    }
}