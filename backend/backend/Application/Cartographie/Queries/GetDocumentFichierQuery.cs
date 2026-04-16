using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

public record GetDocumentFichierQuery(Guid DocumentId) : IRequest<DocumentFichierDto?>;

public record DocumentFichierDto(byte[] FichierData, string? FichierType, string? FichierNom);

public class GetDocumentFichierQueryHandler
    : IRequestHandler<GetDocumentFichierQuery, DocumentFichierDto?>
{
    private readonly AppDbContext _ctx;
    public GetDocumentFichierQueryHandler(AppDbContext ctx) => _ctx = ctx;

    public async Task<DocumentFichierDto?> Handle(GetDocumentFichierQuery request, CancellationToken ct)
    {
        var doc = await _ctx.Documents
            .Where(d => d.Id == request.DocumentId)
            .Select(d => new DocumentFichierDto(d.FichierData!, d.FichierType, d.FichierNom))
            .FirstOrDefaultAsync(ct);
        return doc;
    }
}