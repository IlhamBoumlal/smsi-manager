using backend.Application.DTOs.Documentation;
using MediatR;

namespace backend.Application.Documentation.Commands.NewDocumentationVersion
{
    public record NewDocumentationVersionCommand(
        Guid Id,
        string Name,
        string Type,
        string Category,
        string Version,
        string Classification,
        string Author,
        string? Approver,
        string? Clause,
        string? Controle,
        string? Processus,
        string? Description,
        bool RemoveFile,
        IFormFile? File,
        string CurrentUserId,
        int? CurrentSocieteId,
        IReadOnlyCollection<string> CurrentRoles
    ) : IRequest<(bool Success, string? Error, DocumentationResponseDto? Data)>;
}
