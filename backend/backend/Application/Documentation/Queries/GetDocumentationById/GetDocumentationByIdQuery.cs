using backend.Application.DTOs.Documentation;
using MediatR;

namespace backend.Application.Documentation.Queries.GetDocumentationById
{
    public record GetDocumentationByIdQuery(
        Guid Id,
        string CurrentUserId,
        int? CurrentSocieteId,
        IReadOnlyCollection<string> CurrentRoles
    ) : IRequest<DocumentationResponseDto?>;
}
