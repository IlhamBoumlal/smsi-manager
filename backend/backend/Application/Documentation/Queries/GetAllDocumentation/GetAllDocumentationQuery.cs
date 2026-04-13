using backend.Application.DTOs.Documentation;
using MediatR;

namespace backend.Application.Documentation.Queries.GetAllDocumentation
{
    public record GetAllDocumentationQuery(
        string? Search,
        string? Type,
        string? Status,
        string? Category,
        string CurrentUserId,
        int? CurrentSocieteId,
        IReadOnlyCollection<string> CurrentRoles
    ) : IRequest<IEnumerable<DocumentationResponseDto>>;
}
