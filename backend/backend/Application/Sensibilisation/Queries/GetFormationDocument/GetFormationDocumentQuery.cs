// Application/Sensibilisation/Queries/GetFormationDocument/GetFormationDocumentQuery.cs
using MediatR;
using backend.Domain.Entities;

namespace backend.Application.Sensibilisation.Queries.GetFormationDocument;

public record GetFormationDocumentQuery(
    Guid FormationId,
    Guid DocumentId,
    int? SocieteId
) : IRequest<FormationDocument?>;