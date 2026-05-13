using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Commands;

public record UpdateProcessusCommand(
    Guid Id,
    string Categorie,
    string Nom,
    string Responsable,
    string Description,
    List<string> IsoReferences,
    int? SocieteId,
    string CurrentUserId
) : IRequest;

public class UpdateProcessusCommandHandler : IRequestHandler<UpdateProcessusCommand>
{
    private readonly IProcessusRepository _repo;
    private readonly AppDbContext _context;
    private readonly ICartographieDocumentationSyncService _documentationSync;

    public UpdateProcessusCommandHandler(
        IProcessusRepository repo,
        AppDbContext context,
        ICartographieDocumentationSyncService documentationSync)
    {
        _repo = repo;
        _context = context;
        _documentationSync = documentationSync;
    }

    public async Task Handle(UpdateProcessusCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.Id, cmd.SocieteId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.Id} introuvable.");
        var previousName = p.Nom;

        p.Update(cmd.Categorie, cmd.Nom, cmd.Responsable, cmd.Description);
        await SyncIsoReferencesAsync(p.Id, cmd.IsoReferences, cmd.SocieteId, ct);
        await _repo.SaveChangesAsync(ct);

        await _documentationSync.SyncOnProcessusRenamedAsync(
            previousName,
            cmd.Nom,
            cmd.SocieteId,
            cmd.CurrentUserId,
            ct);
    }

    private async Task SyncIsoReferencesAsync(Guid processusId, List<string> references, int? societeId, CancellationToken ct)
    {
        references ??= new List<string>();

        var (clauseCodes, controleCodes) = SplitIsoReferences(references);

        var wantedClauses = await _context.IsoClauses
            .Where(c => clauseCodes.Contains(c.Number))
            .ToListAsync(ct);

        var wantedControles = await _context.Controles
            .Where(c => controleCodes.Contains(c.Code))
            .ToListAsync(ct);

        var existingClauses = await _context.ProcessusClauses
            .Where(pc => pc.ProcessusId == processusId)
            .ToListAsync(ct);

        var existingControles = await _context.ProcessusControles
            .Where(pc => pc.ProcessusId == processusId)
            .ToListAsync(ct);

        var wantedClauseIds = wantedClauses.Select(c => c.Id).ToHashSet();
        var wantedControleIds = wantedControles.Select(c => c.Id).ToHashSet();

        var toRemoveClauses = existingClauses.Where(pc => !wantedClauseIds.Contains(pc.ClauseId));
        var toRemoveControles = existingControles.Where(pc => !wantedControleIds.Contains(pc.ControleId));

        _context.ProcessusClauses.RemoveRange(toRemoveClauses);
        _context.ProcessusControles.RemoveRange(toRemoveControles);

        foreach (var clause in wantedClauses)
        {
            if (existingClauses.Any(pc => pc.ClauseId == clause.Id))
                continue;

            _context.ProcessusClauses.Add(new ProcessusClause
            {
                ProcessusId = processusId,
                ClauseId = clause.Id,
                SocieteId = societeId,
                Justification = null
            });
        }

        foreach (var controle in wantedControles)
        {
            if (existingControles.Any(pc => pc.ControleId == controle.Id))
                continue;

            _context.ProcessusControles.Add(new ProcessusControle
            {
                ProcessusId = processusId,
                ControleId = controle.Id,
                SocieteId = societeId,
                Justification = null
            });
        }
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
}
