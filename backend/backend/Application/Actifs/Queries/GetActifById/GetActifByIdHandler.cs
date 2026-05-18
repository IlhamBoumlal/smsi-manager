using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Interfaces;
using MediatR;
namespace backend.Application.Actifs.Queries.GetActifById
{
    public class GetActifByIdHandler : IRequestHandler<GetActifByIdQuery, ActifResponseDto?>
    {
        private readonly IActifRepository _repository;
        public GetActifByIdHandler(IActifRepository repository) => _repository = repository;

        public async Task<ActifResponseDto?> Handle(GetActifByIdQuery request, CancellationToken ct)
        {
            var actif = await _repository.GetByIdAsync(request.Id, request.SocieteId);
            if (actif is null) return null;
            return new ActifResponseDto(
                actif.Id, actif.Nom, actif.Description, actif.Type,
                actif.Categorie, actif.Classification, actif.ProprietaireNom);  // ← ProprietaireNom
        }
    }
}