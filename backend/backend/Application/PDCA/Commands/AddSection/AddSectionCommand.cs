using MediatR;
namespace Application.PDCA.Commands.AddSection;
public record AddSectionCommand(Guid PhaseId, string Title) : IRequest<Guid>;
