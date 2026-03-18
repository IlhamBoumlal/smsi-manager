using MediatR;

namespace backend.Application.Holdings.Commands.CreateHolding
{
    public record CreateHoldingCommand(string Nom) : IRequest<(bool Success, string? Error)>;
}
