using MediatR;
namespace Application.PDCA.Commands.CreateCycle;
public record CreateCycleCommand(string Name) : IRequest<Guid>;
