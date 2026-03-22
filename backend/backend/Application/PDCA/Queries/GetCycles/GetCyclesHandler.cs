using Application.DTOs;
using Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Queries.GetCycles;

public class GetCyclesHandler : IRequestHandler<GetCyclesQuery, List<CycleSummaryDto>>
{
    private readonly IPdcaRepository _repo;
    public GetCyclesHandler(IPdcaRepository repo) => _repo = repo;

    public async Task<List<CycleSummaryDto>> Handle(GetCyclesQuery request, CancellationToken ct)
    {
        var cycles = await _repo.GetAllAsync(ct);
        return cycles.Select(c => new CycleSummaryDto(c.Id, c.Name, c.IsActive, c.CreatedAt)).ToList();
    }
}
