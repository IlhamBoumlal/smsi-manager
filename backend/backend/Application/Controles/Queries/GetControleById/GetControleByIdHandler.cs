using backend.Application.DTOs.Controles;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Encodings.Web;
using System.Text.Json.Serialization;

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
        if (!request.SocieteId.HasValue || request.SocieteId.Value <= 0)
            return null;

        await EnsureSocieteControlesAsync(request.SocieteId.Value, cancellationToken);

        var entite = await _context.Controles
            .AsNoTracking()
            .Where(c => c.Id == request.Id && c.SocieteId == request.SocieteId.Value)
            .FirstOrDefaultAsync(cancellationToken);

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

        var templates = await LoadControleTemplatesAsync(cancellationToken);

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

    private static async Task<List<backend.Domain.Entities.Controle>> LoadControleTemplatesAsync(CancellationToken cancellationToken)
    {
        var candidatePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "controles.json"),
            Path.Combine(AppContext.BaseDirectory, "Infrastructure", "SeedData", "controles.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "controles.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "backend", "Infrastructure", "SeedData", "controles.json")
        };

        var jsonPath = candidatePaths.FirstOrDefault(File.Exists);
        if (string.IsNullOrWhiteSpace(jsonPath))
            return [];

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        var jsonContent = await File.ReadAllTextAsync(jsonPath, cancellationToken);
        var dtos = JsonSerializer.Deserialize<List<ControleDto>>(jsonContent, options);
        if (dtos is null || dtos.Count == 0)
            return [];

        return dtos
            .OrderBy(dto => dto.Code)
            .Select(dto => new backend.Domain.Entities.Controle
            {
                Code = dto.Code,
                Titre = dto.Titre,
                Description = dto.Description,
                Domaine = dto.Domaine,
                Applicable = dto.Applicable,
                RaisonsApplicabilite = dto.RaisonsApplicabilite != null && dto.RaisonsApplicabilite.Any()
                    ? JsonSerializer.Serialize(dto.RaisonsApplicabilite)
                    : null,
                RaisonExclusion = dto.RaisonExclusion,
                Statut = dto.Statut,
                JustificationConformite = dto.JustificationConformite,
                Remarque = dto.Remarque,
                Preuves = dto.Preuves,
                Steps = dto.Steps != null ? JsonSerializer.Serialize(dto.Steps) : null,
                Priorite = dto.Priorite,
                StatutPlan = dto.StatutPlan,
                ResponsablePlan = dto.ResponsablePlan,
                DateEcheance = dto.DateEcheance,
                DateMiseAJour = dto.DateMiseAJour ?? DateTime.UtcNow,
                DernierModificateurId = dto.DernierModificateurId,
                DernierModificateurNom = dto.DernierModificateurNom
            })
            .ToList();
    }
}
