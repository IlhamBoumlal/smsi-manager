using Application.DTOs;
using backend.Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Queries.GetCycleById;

public class GetCycleByIdHandler : IRequestHandler<GetCycleByIdQuery, CycleDetailDto?>
{
    private readonly IPdcaRepository _repo;
    public GetCycleByIdHandler(IPdcaRepository repo) => _repo = repo;

    public async Task<CycleDetailDto?> Handle(GetCycleByIdQuery query, CancellationToken ct)
    {
        var cycle = await _repo.GetByIdAsync(query.Id, ct);
        if (cycle is null) return null;

        return new CycleDetailDto(cycle.Id, cycle.Name, cycle.IsActive,
            cycle.Phases.OrderBy(p => p.Order).Select(p => new PhaseDto(p.Id, p.Key, p.Label, p.Order,
                p.Sections.Select(s => new SectionDto(s.Id, s.Title,
                    s.Items.Select(i => new ItemDto(i.Id, i.Text, i.Status)).ToList())).ToList())).ToList());
    }
}
