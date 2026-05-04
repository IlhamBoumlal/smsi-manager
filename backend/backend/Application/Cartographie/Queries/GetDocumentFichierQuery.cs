using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Queries;

public record GetDocumentFichierQuery(Guid DocumentId, int? SocieteId) : IRequest<DocumentFichierDto?>;

public record DocumentFichierDto(byte[] FichierData, string? FichierType, string? FichierNom);

public class GetDocumentFichierQueryHandler : IRequestHandler<GetDocumentFichierQuery, DocumentFichierDto?>
{
    private readonly AppDbContext _ctx;
    public GetDocumentFichierQueryHandler(AppDbContext ctx) => _ctx = ctx;

    public async Task<DocumentFichierDto?> Handle(GetDocumentFichierQuery request, CancellationToken ct)
    {
        if (!request.SocieteId.HasValue || request.SocieteId.Value <= 0)
            return null;

        var doc = await _ctx.Documents
            .Where(d => d.Id == request.DocumentId)
            .Where(d => d.SocieteId == request.SocieteId.Value)
            .Select(d => new DocumentFichierDto(d.FichierData!, d.FichierType, d.FichierNom))
            .FirstOrDefaultAsync(ct);
        return doc;
    }
}
