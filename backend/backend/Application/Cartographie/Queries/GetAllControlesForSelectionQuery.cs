using Application.DTOs.Cartographie;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Queries;

/// <summary>DTO pour la sélection d'un contrôle (liste simple)</summary>
public record ControleSelectDto(
    Guid Id,
    string Code,
    string Titre,
    string Domaine,
    string Statut
);

/// <summary>Query pour récupérer tous les contrôles disponibles pour sélection</summary>
public record GetAllControlesForSelectionQuery(
    int? SocieteId
) : IRequest<List<ControleSelectDto>>;

/// <summary>Handler pour GetAllControlesForSelectionQuery</summary>
public class GetAllControlesForSelectionQueryHandler : IRequestHandler<GetAllControlesForSelectionQuery, List<ControleSelectDto>>
{
    private readonly AppDbContext _context;
    
    public GetAllControlesForSelectionQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ControleSelectDto>> Handle(GetAllControlesForSelectionQuery query, CancellationToken ct)
    {
        var controles = await _context.Controles
            .Where(c => query.SocieteId == null || c.SocieteId == query.SocieteId)
            .OrderBy(c => c.Code)
            .Select(c => new ControleSelectDto(
                c.Id,
                c.Code,
                c.Titre,
                c.Domaine.ToString(),
                c.Statut.ToString()
            ))
            .ToListAsync(ct);

        return controles;
    }
}
