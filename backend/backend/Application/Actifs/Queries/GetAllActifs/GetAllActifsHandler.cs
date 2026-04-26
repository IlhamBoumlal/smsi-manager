using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Actifs.Queries.GetAllActifs
{
    public class GetAllActifsHandler : IRequestHandler<GetAllActifsQuery, IEnumerable<ActifResponseDto>>
    {
        private readonly IActifRepository _repository;
        public GetAllActifsHandler(IActifRepository repository) => _repository = repository;

        public async Task<IEnumerable<ActifResponseDto>> Handle(GetAllActifsQuery request, CancellationToken ct)
        {
            var actifs = await _repository.GetAllAsync(request.SocieteId);
            return actifs.Select(a => new ActifResponseDto(
                a.Id, a.Nom, a.Description, a.Type,
                a.Categorie, a.Classification, a.ProprietaireId));
        }
    }
}
