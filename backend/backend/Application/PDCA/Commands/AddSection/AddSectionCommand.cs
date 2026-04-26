using MediatR;
namespace Application.PDCA.Commands.AddSection;
public record AddSectionCommand(Guid PhaseId, string Title, int? SocieteId = null) : IRequest<Guid>;
