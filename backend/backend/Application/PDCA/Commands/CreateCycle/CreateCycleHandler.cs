using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Commands.CreateCycle;

public class CreateCycleHandler : IRequestHandler<CreateCycleCommand, Guid>
{
    private readonly IPdcaRepository _repo;
    public CreateCycleHandler(IPdcaRepository repo) => _repo = repo;

    public async Task<Guid> Handle(CreateCycleCommand cmd, CancellationToken ct)
    {
        var cycle = new PdcaCycle { Name = cmd.Name };
        foreach (var (key, label, order) in new[] {
            ("plan","PLAN",0), ("do","DO",1), ("check","CHECK",2), ("act","ACT",3) })
        {
            cycle.Phases.Add(new Phase { CycleId=cycle.Id, Key=key, Label=label, Order=order });
        }
        _repo.Add(cycle);
        await _repo.SaveChangesAsync(ct);
        return cycle.Id;
    }
}
