// Application/Sensibilisation/Queries/GetFormationDocument/GetFormationDocumentQueryHandler.cs
using MediatR;
using backend.Domain.Entities;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Queries.GetFormationDocument;

public class GetFormationDocumentQueryHandler(IFormationRepository repo)
    : IRequestHandler<GetFormationDocumentQuery, FormationDocument?>
{
    public async Task<FormationDocument?> Handle(
        GetFormationDocumentQuery query, CancellationToken ct)
    {
        var formation = await repo.GetByIdAsync(query.FormationId, ct);
        return formation?.FormationDocuments
            .FirstOrDefault(d => d.Id == query.DocumentId);
    }
}