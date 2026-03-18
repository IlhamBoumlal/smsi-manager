using backend.Application.DTOs.Authentification;
using MediatR;

namespace backend.Application.Holdings.Queries.GetAllHoldings
{
    public record GetAllHoldingsQuery() : IRequest<List<HoldingDto>>;
}
