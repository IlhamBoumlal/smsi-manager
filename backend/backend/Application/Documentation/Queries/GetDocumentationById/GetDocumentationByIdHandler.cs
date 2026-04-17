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
            if (document is null) return null;

            var actor = DocumentationAccessControl.BuildActorContext(
                request.CurrentUserId,
                request.CurrentSocieteId,
                request.CurrentRoles);

            if (!DocumentationAccessControl.CanViewDocument(actor, document))
                return null;

            var isOwn = DocumentationAccessControl.IsOwnedByActor(actor, document);
            var canEdit = DocumentationAccessControl.CanEditDocument(actor, document, document.Category, document.Status);
            var canDelete = DocumentationAccessControl.CanDeleteDocument(actor, document);
            var canApprove = DocumentationAccessControl.CanApproveDocument(actor, document);
            var canCreateVersion = DocumentationAccessControl.CanCreateVersionDocument(actor, document);
            return DocumentationHelpers.ToDto(document, canEdit, canDelete, canApprove, canCreateVersion, isOwn);
        }
    }
}
