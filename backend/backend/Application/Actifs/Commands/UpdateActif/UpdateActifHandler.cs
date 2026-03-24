using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Actifs.Commands.UpdateActif
{
    public class UpdateActifHandler : IRequestHandler<UpdateActifCommand, ActifResponseDto?>
    {
        private readonly IActifRepository _repository;
        public UpdateActifHandler(IActifRepository repository) => _repository = repository;

        public async Task<ActifResponseDto?> Handle(UpdateActifCommand request, CancellationToken ct)
        {
            var actif = new Actif
            {
                Id = request.Id,
                Nom = request.Nom,
                Description = request.Description,
                Type = request.Type,
                Categorie = request.Categorie,
                Classification = request.Classification,
                ProprietaireId = request.ProprietaireId
            };
            var updated = await _repository.UpdateAsync(actif);
            if (updated is null) return null;
            return new ActifResponseDto(
                updated.Id, updated.Nom, updated.Description, updated.Type,
                updated.Categorie, updated.Classification, updated.ProprietaireId);
        }
    }
}
