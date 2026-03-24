using backend.Application.DTOs.Documentation;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Documentation.Commands.UpdateDocumentation
{
    public class UpdateDocumentationHandler : IRequestHandler<UpdateDocumentationCommand, (bool Success, string? Error, DocumentationResponseDto? Data)>
    {
        private readonly IDocumentationRepository _repository;
        private readonly IFileStorageService _fileStorage;

        public UpdateDocumentationHandler(IDocumentationRepository repository, IFileStorageService fileStorage)
        {
            _repository = repository;
            _fileStorage = fileStorage;
        }

        public async Task<(bool Success, string? Error, DocumentationResponseDto? Data)> Handle(UpdateDocumentationCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id);
            if (existing is null)
                return (false, "Document introuvable.", null);

            if (string.IsNullOrWhiteSpace(request.Name))
                return (false, "Le nom du document est requis.", null);

            if (string.IsNullOrWhiteSpace(request.Type) || string.IsNullOrWhiteSpace(request.Category))
                return (false, "Le type et la catégorie sont requis.", null);

            if (string.IsNullOrWhiteSpace(request.Author))
                return (false, "L'auteur est requis.", null);

            if (!DocumentationHelpers.IsAllowedFile(request.File))
                return (false, "Fichier invalide. Formats autorisés: PDF, DOCX, XLSX. Taille max: 20 Mo.", null);

            var updated = new DocumentationDocument
            {
                Id = existing.Id,
                Name = request.Name.Trim(),
                Type = request.Type.Trim(),
                Category = request.Category.Trim(),
                Status = DocumentationHelpers.NormalizeStatus(request.Status),
                Version = string.IsNullOrWhiteSpace(request.Version) ? "1.0" : request.Version.Trim(),
                Classification = string.IsNullOrWhiteSpace(request.Classification) ? "Interne" : request.Classification.Trim(),
                Author = request.Author.Trim(),
                Approver = request.Approver?.Trim(),
                Clause = request.Clause?.Trim(),
                Controle = request.Controle?.Trim(),
                Description = request.Description?.Trim(),
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
                return (false, "Document introuvable.", null);

            return (true, null, DocumentationHelpers.ToDto(saved));
        }
    }
}
