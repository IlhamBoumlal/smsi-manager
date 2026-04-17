using MediatR;

namespace backend.Application.Documentation.Commands.DeleteDocumentation
{
    public record DeleteDocumentationCommand(
        Guid Id,
        string CurrentUserId,
        int? CurrentSocieteId,
        IReadOnlyCollection<string> CurrentRoles
    ) : IRequest<(bool Success, string? Error)>;
}
