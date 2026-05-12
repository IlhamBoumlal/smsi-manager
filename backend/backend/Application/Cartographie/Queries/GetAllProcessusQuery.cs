using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Queries;

public record GetAllProcessusQuery(int? SocieteId) : IRequest<List<ProcessusDto>>;

public class GetAllProcessusQueryHandler : IRequestHandler<GetAllProcessusQuery, List<ProcessusDto>>
{
    private readonly IProcessusRepository _repo;
    public GetAllProcessusQueryHandler(IProcessusRepository repo) => _repo = repo;

    public async Task<List<ProcessusDto>> Handle(GetAllProcessusQuery request, CancellationToken ct)
    {
        var list = await _repo.GetAllAsync(request.SocieteId, ct);
        return list.Select(ToDto).ToList();
    }

    private static ProcessusDto ToDto(Processus p) => new(
        p.Id,
        p.Categorie,
        p.Nom,
        p.Responsable,
        p.Description,
        BuildIsoReferences(p),
        p.Documents.Select(d => new DocumentDto(d.Id, d.Nom, d.Type, d.Reference, d.Statut, d.FichierNom, d.FichierType, !string.IsNullOrEmpty(d.FichierNom))).ToList()
    );

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
