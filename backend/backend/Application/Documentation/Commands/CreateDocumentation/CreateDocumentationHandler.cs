using backend.Application.DTOs.Documentation;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Documentation.Commands.CreateDocumentation
{
    public class CreateDocumentationHandler : IRequestHandler<CreateDocumentationCommand, (bool Success, string? Error, DocumentationResponseDto? Data)>
    {
        private readonly IDocumentationRepository _repository;
        private readonly IFileStorageService _fileStorage;

        public CreateDocumentationHandler(IDocumentationRepository repository, IFileStorageService fileStorage)
        {
            _repository = repository;
            _fileStorage = fileStorage;
        }

        public async Task<(bool Success, string? Error, DocumentationResponseDto? Data)> Handle(CreateDocumentationCommand request, CancellationToken cancellationToken)
        {
            var actor = DocumentationAccessControl.BuildActorContext(
                request.CurrentUserId,
                request.CurrentSocieteId,
                request.CurrentRoles);

            if (!DocumentationAccessControl.CanCreateDocument(actor, request.Category, request.Status))
                return (false, "FORBIDDEN: Vous n'etes pas autorise a creer ce document.", null);

            if (string.IsNullOrWhiteSpace(request.Name))
                return (false, "Le nom du document est requis.", null);

            if (string.IsNullOrWhiteSpace(request.Type) || string.IsNullOrWhiteSpace(request.Category))
                return (false, "Le type et la catégorie sont requis.", null);

            if (string.IsNullOrWhiteSpace(request.Author))
                return (false, "L'auteur est requis.", null);

            if (!DocumentationHelpers.IsAllowedFile(request.File))
                return (false, "Fichier invalide. Taille max: 20 Mo.", null);

            var storedPath = await _fileStorage.SaveDocumentAsync(request.File);
            var fileHash = await DocumentationHashing.ComputeSha256HexAsync(request.File, cancellationToken);
            var normalizedStatus = DocumentationHelpers.NormalizeStatus(request.Status);

            var document = new DocumentationDocument
            {
                SocieteId = actor.SocieteId,
                Name = request.Name.Trim(),
                Type = request.Type.Trim(),
                Category = request.Category.Trim(),
                Status = normalizedStatus,
                Version = string.IsNullOrWhiteSpace(request.Version) ? "1.0" : request.Version.Trim(),
                Classification = string.IsNullOrWhiteSpace(request.Classification) ? "Interne" : request.Classification.Trim(),
                Author = request.Author.Trim(),
                Approver = request.Approver?.Trim(),
                Clause = request.Clause?.Trim(),
                Controle = request.Controle?.Trim(),
                Description = request.Description?.Trim(),
                FilePath = storedPath,
                OriginalFileName = request.File?.FileName,
                FileSizeBytes = request.File?.Length,
                FileHash = fileHash,
                CreatedByUserId = actor.UserId,
                LastModifiedByUserId = actor.UserId
            };

            if (normalizedStatus == "approuve")
            {
                document.ApprovedByUserId = actor.UserId;
                document.ApprovedAt = DateTime.UtcNow;
            }

            var created = await _repository.CreateAsync(document);
            var isOwn = DocumentationAccessControl.IsOwnedByActor(actor, created);
            var canEdit = DocumentationAccessControl.CanEditDocument(actor, created, created.Category, created.Status);
            var canDelete = DocumentationAccessControl.CanDeleteDocument(actor, created);
            var canApprove = DocumentationAccessControl.CanApproveDocument(actor, created);
            var canCreateVersion = DocumentationAccessControl.CanCreateVersionDocument(actor, created);
            return (true, null, DocumentationHelpers.ToDto(created, canEdit, canDelete, canApprove, canCreateVersion, isOwn));
        }
    }
}

