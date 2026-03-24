using MediatR;

namespace backend.Application.Societes.Commands.DeleteSociete
{
    public record DeleteSocieteCommand(int Id) : IRequest<(bool Success, string? Error)>;

}
