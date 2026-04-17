using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Profils.Commands.DeleteProfil
{
    public  record DeleteProfilCommand(Guid Id) : IRequest<bool>;
}
