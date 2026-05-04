using MediatR;
namespace Application.PDCA.Commands.CreateCycle;
public record CreateCycleCommand(string Name, int? SocieteId = null) : IRequest<Guid>;
