using backend.Application.Societes;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Societes.Commands.UpdateSociete
{
    public class UpdateSocieteHandler : IRequestHandler<UpdateSocieteCommand, (bool, string?)>
    {
        private readonly ISocieteRepository _repo;
        private readonly IFileStorageService _fileStorage;

        public UpdateSocieteHandler(ISocieteRepository repo, IFileStorageService fileStorage)
        {
            _repo = repo;
            _fileStorage = fileStorage;
        }

        public async Task<(bool, string?)> Handle(UpdateSocieteCommand req, CancellationToken ct)
        {
            var societe = await _repo.GetByIdAsync(req.Id);
            if (societe == null) return (false, "Société introuvable.");

            if (string.IsNullOrWhiteSpace(req.Nom))
                return (false, "Le nom est requis.");
            if (SocieteNamePolicy.IsReserved(req.Nom))
                return (false, "Ce nom de societe est reserve.");

            societe.Nom = req.Nom;
            societe.HoldingId = req.HoldingId;

            if (req.Logo != null)
            {
                _fileStorage.DeleteLogoFile(societe.Logo);
                societe.Logo = await _fileStorage.SaveLogoAsync(req.Logo);
            }

            await _repo.UpdateAsync(societe);
            await _repo.SaveChangesAsync();
            return (true, null);
        }
    }
}
