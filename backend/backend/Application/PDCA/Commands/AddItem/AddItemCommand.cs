using MediatR;
namespace Application.PDCA.Commands.AddItem;
public record AddItemCommand(Guid SectionId, string Text, int? SocieteId = null) : IRequest<Guid>;
