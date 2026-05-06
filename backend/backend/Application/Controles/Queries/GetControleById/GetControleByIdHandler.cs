using backend.Application.DTOs.Controles;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Encodings.Web;

namespace backend.Application.Controles.Queries.GetControleById;

public class GetControleByIdHandler : IRequestHandler<GetControleByIdQuery, ControleDto?>
{
    private readonly AppDbContext _context;

    // Options pour la désérialisation (doit correspondre aux options de l'Update)
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true
    };

    public GetControleByIdHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ControleDto?> Handle(GetControleByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.SocieteId.HasValue)
        {
            await EnsureSocieteControlesAsync(request.SocieteId.Value, cancellationToken);
        }

        // 1. On récupère l'entité depuis la base de données avec filtrage par société
        var entite = await _context.Controles
            .AsNoTracking()
            .Where(c => c.Id == request.Id && (!request.SocieteId.HasValue ? c.SocieteId == null : c.SocieteId == request.SocieteId.Value))
            .FirstOrDefaultAsync(cancellationToken);

        // Si pas trouvé et que c'est pour une société, essayer de trouver par code depuis le contrôle global
        if (entite == null && request.SocieteId.HasValue)
        {
            var controleGlobal = await _context.Controles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.Id && c.SocieteId == null, cancellationToken);

            if (controleGlobal != null)
            {
                // Chercher le contrôle équivalent pour cette société par code
                entite = await _context.Controles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Code == controleGlobal.Code && c.SocieteId == request.SocieteId.Value, cancellationToken);
            }
        }

        if (entite == null) return null;

        // 2. On transforme l'entité en DTO en mémoire pour gérer le JSON
        return new ControleDto
        {
            Id = entite.Id,
            Code = entite.Code,
            Titre = entite.Titre,
            Description = entite.Description,
            Domaine = entite.Domaine,
            Applicable = entite.Applicable,
            RaisonExclusion = entite.RaisonExclusion,
            Statut = entite.Statut,
            JustificationConformite = entite.JustificationConformite,
            Remarque = entite.Remarque,
            Preuves = entite.Preuves,
            Priorite = entite.Priorite,
            StatutPlan = entite.StatutPlan,
            ResponsablePlan = entite.ResponsablePlan,
            DateEcheance = entite.DateEcheance,
            DateMiseAJour = entite.DateMiseAJour,
            DernierModificateurId = entite.DernierModificateurId,
            DernierModificateurNom = entite.DernierModificateurNom,

            // DÉSÉRIALISATION : Texte SQL -> Liste de strings pour React
            RaisonsApplicabilite = string.IsNullOrEmpty(entite.RaisonsApplicabilite)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(entite.RaisonsApplicabilite, _jsonOptions),

            // DÉSÉRIALISATION : Texte SQL -> Objet/Tableau pour React
            Steps = string.IsNullOrEmpty(entite.Steps)
                ? null
                : JsonSerializer.Deserialize<object>(entite.Steps, _jsonOptions)
        };
    }

    private async Task EnsureSocieteControlesAsync(int societeId, CancellationToken cancellationToken)
    {
        var hasControles = await _context.Controles
            .AsNoTracking()
            .AnyAsync(c => c.SocieteId == societeId, cancellationToken);

        if (hasControles)
            return;

        var templates = await _context.Controles
            .AsNoTracking()
            .Where(c => c.SocieteId == null)
            .OrderBy(c => c.Code)
            .ToListAsync(cancellationToken);

        if (!templates.Any())
            return;

        var clones = templates.Select(template => new backend.Domain.Entities.Controle
        {
            Id = Guid.NewGuid(),
            Code = template.Code,
            Titre = template.Titre,
            Description = template.Description,
            Domaine = template.Domaine,
            Applicable = template.Applicable,
            RaisonsApplicabilite = template.RaisonsApplicabilite,
            RaisonExclusion = template.RaisonExclusion,
            Statut = template.Statut,
            JustificationConformite = template.JustificationConformite,
            Remarque = template.Remarque,
            Preuves = template.Preuves,
            Steps = template.Steps,
            Priorite = template.Priorite,
            StatutPlan = template.StatutPlan,
            ResponsablePlan = template.ResponsablePlan,
            DateEcheance = template.DateEcheance,
            DateMiseAJour = DateTime.UtcNow,
            DernierModificateurId = null,
            DernierModificateurNom = null,
            SocieteId = societeId
        }).ToList();

        await _context.Controles.AddRangeAsync(clones, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}