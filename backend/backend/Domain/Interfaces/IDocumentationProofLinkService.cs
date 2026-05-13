using backend.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace backend.Domain.Interfaces
{
    public interface IDocumentationProofLinkService
    {
        Task<DocumentationDocument> FindOrCreateFromFormFileAndLinkAsync(
            IFormFile file,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? processusReference,
            string? description,
            string? requestedType = null,
            string? sourceModule = null,
            string? controleDomaine = null,
            CancellationToken cancellationToken = default);

        Task<DocumentationDocument> FindOrCreateFromBytesAndLinkAsync(
            byte[] content,
            string originalFileName,
            string? contentType,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? processusReference,
            string? description,
            string? requestedType = null,
            string? sourceModule = null,
            string? controleDomaine = null,
            CancellationToken cancellationToken = default);

        Task<DocumentationDocument?> LinkExistingDocumentAsync(
            Guid documentId,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? processusReference,
            string? description,
            string? requestedType = null,
            string? sourceModule = null,
            string? controleDomaine = null,
            CancellationToken cancellationToken = default);
    }
}
