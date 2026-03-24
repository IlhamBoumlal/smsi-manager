using backend.Application.DTOs.Authentification;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Societes.Queries.GetAllSocietes
{
    public class GetAllSocietesHandler : IRequestHandler<GetAllSocietesQuery, List<SocieteDto>>
    {
        private readonly ISocieteRepository _repo;
        public GetAllSocietesHandler(ISocieteRepository repo) => _repo = repo;

        public async Task<List<SocieteDto>> Handle(GetAllSocietesQuery request, CancellationToken ct)
        {
            var societes = await _repo.GetAllAsync(request.HoldingId);
            return societes.Select(s => new SocieteDto(s.Id, s.Nom, s.HoldingId, s.Logo)).ToList();
        }
    }
}
