using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Actifs.Commands.CreateActif
{
    public class CreateActifHandler : IRequestHandler<CreateActifCommand, ActifResponseDto>
    {
        private readonly IActifRepository _repository;
        public CreateActifHandler(IActifRepository repository) => _repository = repository;

        public async Task<ActifResponseDto> Handle(CreateActifCommand request, CancellationToken ct)
        {
            var actif = new Actif
            {
                Nom = request.Nom,
                Description = request.Description,
                Type = request.Type,
                Categorie = request.Categorie,
                Classification = request.Classification,
                ProprietaireId = request.ProprietaireId,
                SocieteId = request.SocieteId
            };
            var created = await _repository.CreateAsync(actif);
            return new ActifResponseDto(
                created.Id, created.Nom, created.Description, created.Type,
                created.Categorie, created.Classification, created.ProprietaireId);
        }
    }
}
