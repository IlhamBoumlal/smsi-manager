using backend.Application.DTOs.Documentation;
using MediatR;

namespace backend.Application.Documentation.Commands.CreateDocumentation
{
    public record CreateDocumentationCommand(
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
        IFormFile? File,
        string CurrentUserId,
        int? CurrentSocieteId,
        IReadOnlyCollection<string> CurrentRoles
    ) : IRequest<(bool Success, string? Error, DocumentationResponseDto? Data)>;
}
