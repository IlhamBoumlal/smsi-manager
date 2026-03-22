using MediatR;
namespace Application.PDCA.Commands.DeleteSection;
public record DeleteSectionCommand(Guid SectionId) : IRequest;
