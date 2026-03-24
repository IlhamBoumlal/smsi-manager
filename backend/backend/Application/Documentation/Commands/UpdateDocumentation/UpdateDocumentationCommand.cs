using backend.Application.DTOs.Documentation;
using MediatR;

namespace backend.Application.Documentation.Commands.UpdateDocumentation
{
    public record UpdateDocumentationCommand(
        Guid Id,
        string Name,
        string Type,
        string Category,
        string Status,
        string Version,
        string Classification,
        string Author,
        string? Approver,
        string? Clause,
        string? Controle,
        string? Description,
        bool RemoveFile,
        IFormFile? File
    ) : IRequest<(bool Success, string? Error, DocumentationResponseDto? Data)>;
}
