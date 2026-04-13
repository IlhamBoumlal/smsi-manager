using MediatR;
namespace Application.PDCA.Commands.UpdateItem;
public record UpdateItemCommand(Guid Id, string? Status = null, string? Text = null) : IRequest;
