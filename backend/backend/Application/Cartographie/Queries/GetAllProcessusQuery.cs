using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Queries;

public record GetAllProcessusQuery : IRequest<List<ProcessusDto>>;

public class GetAllProcessusQueryHandler : IRequestHandler<GetAllProcessusQuery, List<ProcessusDto>>
{
    private readonly IProcessusRepository _repo;
    public GetAllProcessusQueryHandler(IProcessusRepository repo) => _repo = repo;

    public async Task<List<ProcessusDto>> Handle(GetAllProcessusQuery request, CancellationToken ct)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(ToDto).ToList();
    }

    private static ProcessusDto ToDto(Processus p) => new(
        p.Id, p.Categorie, p.Nom, p.Responsable, p.Description,
        p.Documents.Select(d => new DocumentDto(d.Id, d.Nom, d.Type, d.Reference, d.Statut,d.FichierNom,d.FichierType,!string.IsNullOrEmpty(d.FichierNom))).ToList()
    );
}