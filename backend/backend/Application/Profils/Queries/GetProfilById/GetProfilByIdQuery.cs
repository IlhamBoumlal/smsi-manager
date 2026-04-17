using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Profils.Queries.GetProfilById
{
    public record GetProfilByIdQuery(Guid Id) : IRequest<Profil?>;
    
}
