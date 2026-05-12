using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Queries;

/// <summary>DTO pour la sélection d'une clause (liste simple)</summary>
public record ClauseSelectDto(
    int Id,
    string Number,
    string Title
);

/// <summary>Query pour récupérer toutes les clauses disponibles pour sélection</summary>
public record GetAllClausesForSelectionQuery(
    int? SocieteId
) : IRequest<List<ClauseSelectDto>>;

/// <summary>Handler pour GetAllClausesForSelectionQuery</summary>
public class GetAllClausesForSelectionQueryHandler : IRequestHandler<GetAllClausesForSelectionQuery, List<ClauseSelectDto>>
{
    private readonly AppDbContext _context;
    
    public GetAllClausesForSelectionQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClauseSelectDto>> Handle(GetAllClausesForSelectionQuery query, CancellationToken ct)
    {
        var clauses = await _context.IsoClauses
            .Where(c => c.ParentId == null) // Récupérer seulement les clauses principales
            .OrderBy(c => c.Number)
            .Select(c => new ClauseSelectDto(
                c.Id,
                c.Number,
                c.Title
            ))
            .ToListAsync(ct);

        return clauses;
    }
}
