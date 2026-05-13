using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Cartographie.Commands;

public record CreateProcessusCommand(
    string Categorie,
    string Nom,
    string Responsable,
    string Description,
    List<string> IsoReferences,
    int? SocieteId
) : IRequest<ProcessusDto>;

public class CreateProcessusCommandHandler : IRequestHandler<CreateProcessusCommand, ProcessusDto>
{
    private readonly IProcessusRepository _repo;
    private readonly AppDbContext _context;
    private readonly ILogger<CreateProcessusCommandHandler> _logger;

    public CreateProcessusCommandHandler(IProcessusRepository repo, AppDbContext context, ILogger<CreateProcessusCommandHandler> logger)
    {
        _repo = repo;
        _context = context;
        _logger = logger;
    }

    public async Task<ProcessusDto> Handle(CreateProcessusCommand cmd, CancellationToken ct)
    {
        _logger.LogInformation("Creating processus: {Nom}, SocieteId: {SocieteId}, IsoReferences: {IsoReferences}", cmd.Nom, cmd.SocieteId, string.Join(", ", cmd.IsoReferences ?? new List<string>()));

        var p = Processus.Create(cmd.Categorie, cmd.Nom, cmd.Responsable, cmd.Description, cmd.SocieteId);
        await _repo.AddAsync(p, ct);
        await SyncIsoReferencesAsync(p.Id, cmd.IsoReferences, cmd.SocieteId, ct);
        await _repo.SaveChangesAsync(ct);

        _logger.LogInformation("Processus created successfully: {Id}", p.Id);

        return new ProcessusDto(
            p.Id,
            p.Categorie,
            p.Nom,
            p.Responsable,
            p.Description,
            await BuildIsoReferencesAsync(p.Id, ct),
            new List<DocumentDto>()
        );
    }

    private async Task SyncIsoReferencesAsync(Guid processusId, List<string> references, int? societeId, CancellationToken ct)
    {
        if (references == null || references.Count == 0)
        {
            _logger.LogInformation("No ISO references to sync for processus {ProcessusId}", processusId);
            return;
        }

        var (clauseCodes, controleCodes) = SplitIsoReferences(references);
        _logger.LogInformation("Clause codes: {ClauseCodes}, Controle codes: {ControleCodes}", string.Join(", ", clauseCodes), string.Join(", ", controleCodes));

        var clauses = await _context.IsoClauses
            .Where(c => clauseCodes.Contains(c.Number))
            .ToListAsync(ct);
        _logger.LogInformation("Found {Count} clauses", clauses.Count);

        var controles = await _context.Controles
            .Where(c => controleCodes.Contains(c.Code))
            .ToListAsync(ct);
        _logger.LogInformation("Found {Count} controles", controles.Count);

        foreach (var clause in clauses)
        {
            _context.ProcessusClauses.Add(new ProcessusClause
            {
                ProcessusId = processusId,
                ClauseId = clause.Id,
                SocieteId = societeId,
                Justification = null
            });
        }

        foreach (var controle in controles)
        {
            _context.ProcessusControles.Add(new ProcessusControle
            {
                ProcessusId = processusId,
                ControleId = controle.Id,
                SocieteId = societeId,
                Justification = null
            });
        }

        _logger.LogInformation("Added {ClauseCount} clause associations and {ControleCount} controle associations", clauses.Count, controles.Count);
    }

    private static (List<string> clauseCodes, List<string> controleCodes) SplitIsoReferences(List<string> references)
    {
        var clauseCodes = new List<string>();
        var controleCodes = new List<string>();

        foreach (var raw in references.Where(r => !string.IsNullOrWhiteSpace(r)))
        {
            var text = raw.Trim();
            var prefix = text.Split('-')[0].Trim();
            if (prefix.StartsWith("A.", StringComparison.OrdinalIgnoreCase) || prefix.StartsWith("A", StringComparison.OrdinalIgnoreCase))
            {
                controleCodes.Add(prefix);
            }
            else
            {
                clauseCodes.Add(prefix);
            }
        }

        return (clauseCodes.Distinct(StringComparer.OrdinalIgnoreCase).ToList(), controleCodes.Distinct(StringComparer.OrdinalIgnoreCase).ToList());
    }

    private async Task<List<string>> BuildIsoReferencesAsync(Guid processusId, CancellationToken ct)
    {
        var clauseRefs = await _context.ProcessusClauses
            .Where(pc => pc.ProcessusId == processusId)
            .Include(pc => pc.Clause)
            .Select(pc => pc.Clause)
            .Where(c => c != null)
            .ToListAsync(ct);

        var controlRefs = await _context.ProcessusControles
            .Where(pc => pc.ProcessusId == processusId)
            .Include(pc => pc.Controle)
            .Select(pc => pc.Controle)
            .Where(c => c != null)
            .ToListAsync(ct);

        return clauseRefs
            .Select(c => $"{c!.Number} - {c.Title}")
            .Concat(controlRefs.Select(c => $"{c!.Code} - {c.Titre}"))
            .Distinct()
            .ToList();
    }
}
