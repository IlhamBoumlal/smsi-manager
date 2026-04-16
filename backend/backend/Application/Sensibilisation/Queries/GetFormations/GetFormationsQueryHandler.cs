// Application/Sensibilisation/Queries/GetFormations/GetFormationsQueryHandler.cs
using MediatR;
using backend.Application.DTOs;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Queries.GetFormations;

public class GetFormationsQueryHandler(IFormationRepository repo)
    : IRequestHandler<GetFormationsQuery, List<FormationListDto>>
{
    public async Task<List<FormationListDto>> Handle(
        GetFormationsQuery request, CancellationToken ct)
    {
        var formations = await repo.GetAllAsync(request.SocieteId, ct);
        return formations.Select(f => f.ToListDto()).ToList();
    }
}