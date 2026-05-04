using MediatR;

namespace backend.Application.Actifs.Commands.DeleteActif
{
    public record DeleteActifCommand(Guid Id, int? SocieteId) : IRequest<bool>;
}
