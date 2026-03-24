using MediatR;

namespace backend.Application.Holdings.Commands.UpdateHolding
{
    public record UpdateHoldingCommand(int Id, string Nom) : IRequest<(bool Success, string? Error)>;
}
