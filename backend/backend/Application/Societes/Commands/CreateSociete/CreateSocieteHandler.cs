using backend.Application.Societes;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Societes.Commands.CreateSociete
{
    public class CreateSocieteHandler : IRequestHandler<CreateSocieteCommand, (bool, string?)>
    {
        private readonly ISocieteRepository _repo;
        private readonly IFileStorageService _fileStorage;

        public CreateSocieteHandler(ISocieteRepository repo, IFileStorageService fileStorage)
        {
            _repo = repo;
            _fileStorage = fileStorage;
        }

        public async Task<(bool, string?)> Handle(CreateSocieteCommand req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.Nom))
                return (false, "Le nom est requis.");
            if (SocieteNamePolicy.IsReserved(req.Nom))
                return (false, "Ce nom de societe est reserve.");

            var logoPath = await _fileStorage.SaveLogoAsync(req.Logo);

            await _repo.AddAsync(new Societe
            {
                Nom = req.Nom,
                HoldingId = req.HoldingId,
                Logo = logoPath
            });
            await _repo.SaveChangesAsync();
            return (true, null);
        }
    }
}
