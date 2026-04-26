using backend.Application.DTOs.Documentation;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Documentation.Commands.NewDocumentationVersion
{
    public class NewDocumentationVersionHandler : IRequestHandler<NewDocumentationVersionCommand, (bool Success, string? Error, DocumentationResponseDto? Data)>
    {
        private readonly IDocumentationRepository _repository;
        private readonly IFileStorageService _fileStorage;

        public NewDocumentationVersionHandler(IDocumentationRepository repository, IFileStorageService fileStorage)
        {
            _repository = repository;
            _fileStorage = fileStorage;
        }

        public async Task<(bool Success, string? Error, DocumentationResponseDto? Data)> Handle(NewDocumentationVersionCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id, request.CurrentSocieteId);
            if (existing is null)
                return (false, "NOT_FOUND", null);

            var actor = DocumentationAccessControl.BuildActorContext(
                request.CurrentUserId,
                request.CurrentSocieteId,
                request.CurrentRoles);

            if (!DocumentationAccessControl.CanCreateVersionDocument(actor, existing))
                return (false, "FORBIDDEN: Vous n'etes pas autorise a publier une nouvelle version.", null);

            if (!DocumentationAccessControl.CanCreateDocument(actor, request.Category, "en-validation"))
                return (false, "FORBIDDEN: Vous n'etes pas autorise a publier une nouvelle version dans cette categorie.", null);

            if (string.IsNullOrWhiteSpace(request.Name))
                return (false, "Le nom du document est requis.", null);

            if (string.IsNullOrWhiteSpace(request.Type) || string.IsNullOrWhiteSpace(request.Category))
                return (false, "Le type et la categorie sont requis.", null);

            if (string.IsNullOrWhiteSpace(request.Author))
                return (false, "L'auteur est requis.", null);

            if (!DocumentationHelpers.IsAllowedFile(request.File))
                return (false, "Fichier invalide. Formats autorises: PDF, DOCX, XLSX. Taille max: 20 Mo.", null);

            var requestedVersion = request.Version?.Trim();
            var version = string.IsNullOrWhiteSpace(requestedVersion)
                ? SuggestNextVersion(existing.Version)
                : requestedVersion;

            var updated = new DocumentationDocument
            {
                Id = existing.Id,
                Name = request.Name.Trim(),
                Type = request.Type.Trim(),
                Category = request.Category.Trim(),
                Status = "en-validation",
                Version = version,
                Classification = string.IsNullOrWhiteSpace(request.Classification) ? "Interne" : request.Classification.Trim(),
                Author = request.Author.Trim(),
                Approver = request.Approver?.Trim(),
                Clause = request.Clause?.Trim(),
                Controle = request.Controle?.Trim(),
                Description = request.Description?.Trim(),
                SocieteId = existing.SocieteId,
                CreatedByUserId = existing.CreatedByUserId,
                LastModifiedByUserId = actor.UserId,
                ApprovedByUserId = null,
                ApprovedAt = null,
                CreatedAt = existing.CreatedAt,
                UpdatedAt = DateTime.UtcNow,
                FilePath = existing.FilePath,
                OriginalFileName = existing.OriginalFileName,
                FileSizeBytes = existing.FileSizeBytes
            };

            if (request.File is not null)
            {
                _fileStorage.DeleteDocumentFile(existing.FilePath);
                updated.FilePath = await _fileStorage.SaveDocumentAsync(request.File);
                updated.OriginalFileName = request.File.FileName;
                updated.FileSizeBytes = request.File.Length;
            }
            else if (request.RemoveFile)
            {
                _fileStorage.DeleteDocumentFile(existing.FilePath);
                updated.FilePath = null;
                updated.OriginalFileName = null;
                updated.FileSizeBytes = null;
            }

            var saved = await _repository.UpdateAsync(updated);
            if (saved is null)
                return (false, "NOT_FOUND", null);

            var isOwn = DocumentationAccessControl.IsOwnedByActor(actor, saved);
            var canEdit = DocumentationAccessControl.CanEditDocument(actor, saved, saved.Category, saved.Status);
            var canDelete = DocumentationAccessControl.CanDeleteDocument(actor, saved);
            var canApprove = DocumentationAccessControl.CanApproveDocument(actor, saved);
            var canCreateVersion = DocumentationAccessControl.CanCreateVersionDocument(actor, saved);
            return (true, null, DocumentationHelpers.ToDto(saved, canEdit, canDelete, canApprove, canCreateVersion, isOwn));
        }

        private static string SuggestNextVersion(string? currentVersion)
        {
            if (string.IsNullOrWhiteSpace(currentVersion))
                return "1.1";

            var parts = currentVersion
                .Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray();

            if (parts.Length == 0)
                return "1.1";

            var last = parts[^1];
            if (int.TryParse(last, out var parsed))
            {
                parts[^1] = (parsed + 1).ToString();
                return string.Join(".", parts);
            }

            return $"{currentVersion}.1";
        }
    }
}
