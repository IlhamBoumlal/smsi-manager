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
            if (string.IsNullOrWhiteSpace(request.Name))
                return (false, "Le nom du document est requis.", null);

            if (string.IsNullOrWhiteSpace(request.Type) || string.IsNullOrWhiteSpace(request.Category))
                return (false, "Le type et la catégorie sont requis.", null);

            if (string.IsNullOrWhiteSpace(request.Author))
                return (false, "L'auteur est requis.", null);

            if (!DocumentationHelpers.IsAllowedFile(request.File))
                return (false, "Fichier invalide. Formats autorisés: PDF, DOCX, XLSX. Taille max: 20 Mo.", null);

            var storedPath = await _fileStorage.SaveDocumentAsync(request.File);

            var document = new DocumentationDocument
            {
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
                FilePath = storedPath,
                OriginalFileName = request.File?.FileName,
                FileSizeBytes = request.File?.Length
            };

            var created = await _repository.CreateAsync(document);
            return (true, null, DocumentationHelpers.ToDto(created));
        }
    }
}
