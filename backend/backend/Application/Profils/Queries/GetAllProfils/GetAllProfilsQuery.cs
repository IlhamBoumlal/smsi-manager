using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Profils.Queries.GetAllProfils
{
    public record GetAllProfilsQuery
    () : IRequest<List<Profil>>;
}
