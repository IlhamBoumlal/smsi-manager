using backend.Application.DTOs.Authentification;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Holdings.Queries.GetAllHoldings
{
    public class GetAllHoldingsHandler : IRequestHandler<GetAllHoldingsQuery, List<HoldingDto>>
    {
        private readonly IHoldingRepository _repo;
        public GetAllHoldingsHandler(IHoldingRepository repo) => _repo = repo;

        public async Task<List<HoldingDto>> Handle(GetAllHoldingsQuery request, CancellationToken ct)
        {
            var holdings = await _repo.GetAllAsync();
            return holdings.Select(h => new HoldingDto(h.Id, h.Nom)).ToList();
        }
    }
}
