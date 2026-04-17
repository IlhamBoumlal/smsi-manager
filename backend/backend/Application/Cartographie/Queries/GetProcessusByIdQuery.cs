using Application.DTOs.Cartographie;
using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Queries;

public record GetProcessusByIdQuery(Guid Id) : IRequest<ProcessusDto?>;

public class GetProcessusByIdQueryHandler : IRequestHandler<GetProcessusByIdQuery, ProcessusDto?>
{
    private readonly IProcessusRepository _repo;
    public GetProcessusByIdQueryHandler(IProcessusRepository repo) => _repo = repo;

    public async Task<ProcessusDto?> Handle(GetProcessusByIdQuery request, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(request.Id, ct);
        if (p is null) return null;
        return new ProcessusDto(
            p.Id, p.Categorie, p.Nom, p.Responsable, p.Description,
            p.Documents.Select(d => new DocumentDto(d.Id, d.Nom, d.Type, d.Reference, d.Statut,d.FichierNom,d.FichierType, !string.IsNullOrEmpty(d.FichierNom))).ToList()
        );
    }
}