using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Cartographie.Commands;

/// <summary>Command pour ajouter des contrôles à un processus</summary>
public record AddControleToProcessusCommand(
    Guid ProcessusId,
    Guid ControleId,
    int? SocieteId,
    string? Justification = null
) : IRequest;

/// <summary>Handler pour AddControleToProcessusCommand</summary>
public class AddControleToProcessusCommandHandler : IRequestHandler<AddControleToProcessusCommand>
{
    private readonly AppDbContext _context;
    
    public AddControleToProcessusCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AddControleToProcessusCommand cmd, CancellationToken ct)
    {
        var processus = await _context.Processus
            .AsTracking()
            .FirstOrDefaultAsync(p => p.Id == cmd.ProcessusId, ct)
            ?? throw new KeyNotFoundException($"Processus {cmd.ProcessusId} non trouvé");

        var controle = await _context.Controles
            .FirstOrDefaultAsync(c => c.Id == cmd.ControleId, ct)
            ?? throw new KeyNotFoundException($"Contrôle {cmd.ControleId} non trouvé");

        // Vérifier si l'association n'existe pas déjà
        var exists = await _context.ProcessusControles
            .AnyAsync(pc => pc.ProcessusId == cmd.ProcessusId && pc.ControleId == cmd.ControleId, ct);
        
        if (exists)
            throw new InvalidOperationException("Cette association existe déjà");

        var pc = new ProcessusControle
        {
            ProcessusId = cmd.ProcessusId,
            ControleId = cmd.ControleId,
            SocieteId = cmd.SocieteId,
            Justification = cmd.Justification
        };

        _context.ProcessusControles.Add(pc);
        await _context.SaveChangesAsync(ct);
    }
}

/// <summary>Command pour supprimer l'association entre un processus et un contrôle</summary>
public record RemoveControleFromProcessusCommand(
    Guid ProcessusId,
    Guid ControleId,
    int? SocieteId
) : IRequest;

/// <summary>Handler pour RemoveControleFromProcessusCommand</summary>
public class RemoveControleFromProcessusCommandHandler : IRequestHandler<RemoveControleFromProcessusCommand>
{
    private readonly AppDbContext _context;
    
    public RemoveControleFromProcessusCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveControleFromProcessusCommand cmd, CancellationToken ct)
    {
        var pc = await _context.ProcessusControles
            .FirstOrDefaultAsync(pc => pc.ProcessusId == cmd.ProcessusId && pc.ControleId == cmd.ControleId, ct)
            ?? throw new KeyNotFoundException("Association non trouvée");

        _context.ProcessusControles.Remove(pc);
        await _context.SaveChangesAsync(ct);
    }
}
