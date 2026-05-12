using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Commands;

/// <summary>Command pour ajouter une clause à un processus</summary>
public record AddClauseToProcessusCommand(
    Guid ProcessusId,
    int ClauseId,
    int? SocieteId,
    string? Justification = null
) : IRequest;

/// <summary>Handler pour AddClauseToProcessusCommand</summary>
public class AddClauseToProcessusCommandHandler : IRequestHandler<AddClauseToProcessusCommand>
{
    private readonly AppDbContext _context;
    
    public AddClauseToProcessusCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AddClauseToProcessusCommand cmd, CancellationToken ct)
    {
        var processus = await _context.Processus
            .AsTracking()
            .FirstOrDefaultAsync(p => p.Id == cmd.ProcessusId, ct)
            ?? throw new KeyNotFoundException($"Processus {cmd.ProcessusId} non trouvé");

        var clause = await _context.IsoClauses
            .FirstOrDefaultAsync(c => c.Id == cmd.ClauseId, ct)
            ?? throw new KeyNotFoundException($"Clause {cmd.ClauseId} non trouvée");

        // Vérifier si l'association n'existe pas déjà
        var exists = await _context.ProcessusClauses
            .AnyAsync(pc => pc.ProcessusId == cmd.ProcessusId && pc.ClauseId == cmd.ClauseId, ct);
        
        if (exists)
            throw new InvalidOperationException("Cette association existe déjà");

        var pcc = new ProcessusClause
        {
            ProcessusId = cmd.ProcessusId,
            ClauseId = cmd.ClauseId,
            SocieteId = cmd.SocieteId,
            Justification = cmd.Justification
        };

        _context.ProcessusClauses.Add(pcc);
        await _context.SaveChangesAsync(ct);
    }
}

/// <summary>Command pour supprimer l'association entre un processus et une clause</summary>
public record RemoveClauseFromProcessusCommand(
    Guid ProcessusId,
    int ClauseId,
    int? SocieteId
) : IRequest;

/// <summary>Handler pour RemoveClauseFromProcessusCommand</summary>
public class RemoveClauseFromProcessusCommandHandler : IRequestHandler<RemoveClauseFromProcessusCommand>
{
    private readonly AppDbContext _context;
    
    public RemoveClauseFromProcessusCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveClauseFromProcessusCommand cmd, CancellationToken ct)
    {
        var pcc = await _context.ProcessusClauses
            .FirstOrDefaultAsync(pcc => pcc.ProcessusId == cmd.ProcessusId && pcc.ClauseId == cmd.ClauseId, ct)
            ?? throw new KeyNotFoundException("Association non trouvée");

        _context.ProcessusClauses.Remove(pcc);
        await _context.SaveChangesAsync(ct);
    }
}
