using backend.Application.DTOs.Documentation;
using MediatR;

namespace backend.Application.Documentation.Queries.GetDocumentationById
{
    public record GetDocumentationByIdQuery(Guid Id) : IRequest<DocumentationResponseDto?>;
}
