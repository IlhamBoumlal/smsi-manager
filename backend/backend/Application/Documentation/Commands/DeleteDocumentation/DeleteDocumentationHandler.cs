using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Documentation.Commands.DeleteDocumentation
{
    public class DeleteDocumentationHandler : IRequestHandler<DeleteDocumentationCommand, (bool Success, string? Error)>
    {
        private readonly IDocumentationRepository _repository;
        private readonly IFileStorageService _fileStorage;

        public DeleteDocumentationHandler(IDocumentationRepository repository, IFileStorageService fileStorage)
        {
            _repository = repository;
            _fileStorage = fileStorage;
        }

        public async Task<(bool Success, string? Error)> Handle(DeleteDocumentationCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id, request.CurrentSocieteId);
            if (existing is null) return (false, "NOT_FOUND");

            var actor = DocumentationAccessControl.BuildActorContext(
                request.CurrentUserId,
                request.CurrentSocieteId,
                request.CurrentRoles);
            if (!DocumentationAccessControl.CanDeleteDocument(actor, existing))
                return (false, "FORBIDDEN");

            _fileStorage.DeleteDocumentFile(existing.FilePath);
            var deleted = await _repository.DeleteAsync(request.Id, request.CurrentSocieteId);
            return deleted ? (true, null) : (false, "NOT_FOUND");
        }
    }
}
