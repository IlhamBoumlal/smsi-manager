using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Profils.Commands.CreateProfil
{
    public record CreateProfilCommand(string Name) : IRequest<Guid>;
}
