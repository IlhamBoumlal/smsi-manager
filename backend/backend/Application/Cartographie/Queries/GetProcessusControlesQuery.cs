using Application.DTOs.Cartographie;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Queries;

/// <summary>Query pour récupérer les contrôles associés à un processus</summary>
public record GetProcessusControlesQuery(
    Guid ProcessusId,
    int? SocieteId
) : IRequest<List<ControleAssocieDto>>;

/// <summary>Handler pour GetProcessusControlesQuery</summary>
public class GetProcessusControlesQueryHandler : IRequestHandler<GetProcessusControlesQuery, List<ControleAssocieDto>>
{
    private readonly AppDbContext _context;
    
    public GetProcessusControlesQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ControleAssocieDto>> Handle(GetProcessusControlesQuery query, CancellationToken ct)
    {
        var controles = await _context.ProcessusControles
            .Where(pc => pc.ProcessusId == query.ProcessusId && (query.SocieteId == null || pc.SocieteId == query.SocieteId))
            .Include(pc => pc.Controle)
            .Select(pc => new ControleAssocieDto(
                pc.Controle!.Id,
                pc.Controle.Code,
                pc.Controle.Titre,
                pc.Controle.Description,
                pc.Controle.Domaine.ToString(),
                pc.Controle.Statut.ToString(),
                pc.Justification,
                pc.CreatedAt
            ))
            .ToListAsync(ct);

        return controles;
    }
}
