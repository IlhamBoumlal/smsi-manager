using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Societes.Commands.DeleteSociete
{
    public class DeleteSocieteHandler : IRequestHandler<DeleteSocieteCommand, (bool, string?)>
    {
        private readonly ISocieteRepository _repo;
        private readonly IFileStorageService _fileStorage;

        public DeleteSocieteHandler(ISocieteRepository repo, IFileStorageService fileStorage)
        {
            _repo = repo;
            _fileStorage = fileStorage;
        }

        public async Task<(bool, string?)> Handle(DeleteSocieteCommand req, CancellationToken ct)
        {
            var societe = await _repo.GetByIdAsync(req.Id);
            if (societe == null) return (false, "Société introuvable.");

            _fileStorage.DeleteLogoFile(societe.Logo);
            await _repo.DeleteAsync(societe);
            await _repo.SaveChangesAsync();
            return (true, null);
        }
    }
}
