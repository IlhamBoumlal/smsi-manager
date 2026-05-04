using MediatR;
namespace Application.PDCA.Commands.RenameSection;
public record RenameSectionCommand(Guid SectionId, string NewTitle, int? SocieteId = null) : IRequest;
