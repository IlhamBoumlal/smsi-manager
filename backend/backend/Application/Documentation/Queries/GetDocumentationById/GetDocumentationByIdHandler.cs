using backend.Application.DTOs.Documentation;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Documentation.Queries.GetDocumentationById
{
    public class GetDocumentationByIdHandler : IRequestHandler<GetDocumentationByIdQuery, DocumentationResponseDto?>
    {
        private readonly IDocumentationRepository _repository;

        public GetDocumentationByIdHandler(IDocumentationRepository repository)
        {
            _repository = repository;
        }

        public async Task<DocumentationResponseDto?> Handle(GetDocumentationByIdQuery request, CancellationToken cancellationToken)
        {
            var document = await _repository.GetByIdAsync(request.Id);
            return document is null ? null : DocumentationHelpers.ToDto(document);
        }
    }
}
