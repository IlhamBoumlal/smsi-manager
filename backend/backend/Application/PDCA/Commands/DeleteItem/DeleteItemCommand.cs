using MediatR;
namespace Application.PDCA.Commands.DeleteItem;
public record DeleteItemCommand(Guid Id) : IRequest;
