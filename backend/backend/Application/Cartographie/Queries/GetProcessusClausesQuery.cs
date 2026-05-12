using Application.DTOs.Cartographie;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Queries;

/// <summary>Query pour récupérer les clauses associées à un processus</summary>
public record GetProcessusClausesQuery(
    Guid ProcessusId,
    int? SocieteId
) : IRequest<List<ClauseAssocieeDto>>;

/// <summary>Handler pour GetProcessusClausesQuery</summary>
public class GetProcessusClausesQueryHandler : IRequestHandler<GetProcessusClausesQuery, List<ClauseAssocieeDto>>
{
    private readonly AppDbContext _context;
    
    public GetProcessusClausesQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClauseAssocieeDto>> Handle(GetProcessusClausesQuery query, CancellationToken ct)
    {
        var clauses = await _context.ProcessusClauses
            .Where(pcc => pcc.ProcessusId == query.ProcessusId && (query.SocieteId == null || pcc.SocieteId == query.SocieteId))
            .Include(pcc => pcc.Clause)
            .Select(pcc => new ClauseAssocieeDto(
                pcc.Clause!.Id,
                pcc.Clause.Number,
                pcc.Clause.Title,
                pcc.Clause.Description,
                pcc.Justification,
                pcc.CreatedAt
            ))
            .ToListAsync(ct);

        return clauses;
    }
}
