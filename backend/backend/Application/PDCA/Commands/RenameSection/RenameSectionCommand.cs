using MediatR;
namespace Application.PDCA.Commands.RenameSection;
public record RenameSectionCommand(Guid SectionId, string NewTitle) : IRequest;
