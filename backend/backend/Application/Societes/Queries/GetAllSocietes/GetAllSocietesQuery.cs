using backend.Application.DTOs.Authentification;
using MediatR;

namespace backend.Application.Societes.Queries.GetAllSocietes
{
    public record GetAllSocietesQuery(int? HoldingId = null) : IRequest<List<SocieteDto>>;

}
