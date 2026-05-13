using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Queries;

/// <summary>Query pour récupérer les détails complets d'un processus avec ses contrôles et clauses associés</summary>
public record GetProcessusDetailQuery(
    Guid ProcessusId,
    int? SocieteId
) : IRequest<ProcessusDetailDto?>;

/// <summary>Handler pour GetProcessusDetailQuery</summary>
public class GetProcessusDetailQueryHandler : IRequestHandler<GetProcessusDetailQuery, ProcessusDetailDto?>
{
    private readonly AppDbContext _context;
    
    public GetProcessusDetailQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProcessusDetailDto?> Handle(GetProcessusDetailQuery query, CancellationToken ct)
    {
        var processus = await _context.Processus
            .Include(p => p.Documents)
            .Include(p => p.ProcessusControles)
                .ThenInclude(pc => pc.Controle)
            .Include(p => p.ProcessusClauses)
                .ThenInclude(pcc => pcc.Clause)
            .FirstOrDefaultAsync(p => p.Id == query.ProcessusId && (query.SocieteId == null || p.SocieteId == query.SocieteId), ct);

        if (processus is null)
            return null;

        var documents = processus.Documents
            .Select(d => new DocumentDto(
                d.Id, d.Nom, d.Type, d.Reference, d.Statut, d.FichierNom, d.FichierType,
                !string.IsNullOrEmpty(d.FichierNom)
            ))
            .ToList();

        var controles = processus.ProcessusControles
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
            .ToList();

        var clauses = processus.ProcessusClauses
            .Select(pcc => new ClauseAssocieeDto(
                pcc.Clause!.Id,
                pcc.Clause.Number,
                pcc.Clause.Title,
                pcc.Clause.Description,
                pcc.Justification,
                pcc.CreatedAt
            ))
            .ToList();

        return new ProcessusDetailDto(
            processus.Id,
            processus.Categorie,
            processus.Nom,
            processus.Responsable,
            processus.Description,
            BuildIsoReferences(processus),
            documents,
            controles,
            clauses
        );

    }

    private static List<string> BuildIsoReferences(Processus processus)
    {
        var refs = new List<string>();
        refs.AddRange(processus.ProcessusClauses
            .Where(pcc => pcc.Clause != null)
            .Select(pcc => $"{pcc.Clause!.Number} - {pcc.Clause!.Title}"));
        refs.AddRange(processus.ProcessusControles
            .Where(pc => pc.Controle != null)
            .Select(pc => $"{pc.Controle!.Code} - {pc.Controle!.Titre}"));
        return refs.Distinct().ToList();
    }
}
