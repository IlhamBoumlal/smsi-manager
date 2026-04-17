using MediatR;

namespace backend.Application.Profils.Commands.UpdateProfil
{
    public record UpdateProfilCommand(Guid Id, string Name):IRequest<bool>;
}
