using backend.Application.DTOs.Documentation;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Documentation.Queries.GetAllDocumentation
{
    public class GetAllDocumentationHandler : IRequestHandler<GetAllDocumentationQuery, IEnumerable<DocumentationResponseDto>>
    {
        private readonly IDocumentationRepository _repository;

        public GetAllDocumentationHandler(IDocumentationRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<DocumentationResponseDto>> Handle(GetAllDocumentationQuery request, CancellationToken cancellationToken)
        {
            var documents = await _repository.GetAllAsync();

            var filtered = documents.Where(d =>
            {
                var matchesSearch = string.IsNullOrWhiteSpace(request.Search)
                    || d.Name.Contains(request.Search, StringComparison.OrdinalIgnoreCase)
                    || d.Author.Contains(request.Search, StringComparison.OrdinalIgnoreCase);

                var matchesType = string.IsNullOrWhiteSpace(request.Type)
                    || string.Equals(d.Type, request.Type, StringComparison.OrdinalIgnoreCase);

                var matchesStatus = string.IsNullOrWhiteSpace(request.Status)
                    || string.Equals(d.Status, request.Status, StringComparison.OrdinalIgnoreCase);

                var matchesCategory = string.IsNullOrWhiteSpace(request.Category)
                    || string.Equals(d.Category, request.Category, StringComparison.OrdinalIgnoreCase);

                return matchesSearch && matchesType && matchesStatus && matchesCategory;
            });

            return filtered.Select(DocumentationHelpers.ToDto);
        }
    }
}
