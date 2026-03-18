using MediatR;

namespace backend.Application.Holdings.Commands.DeleteHolding
{
    public record DeleteHoldingCommand(int Id) : IRequest<(bool Success, string? Error)>;
}
