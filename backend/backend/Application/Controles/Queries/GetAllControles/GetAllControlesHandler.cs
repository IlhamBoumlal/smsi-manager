using backend.Application.DTOs.Controles;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Encodings.Web;

namespace backend.Application.Controles.Queries.GetAllControles;

public class GetAllControlesQueryHandler : IRequestHandler<GetAllControlesQuery, List<ControleDto>>
{
    private readonly AppDbContext _context;

    // On utilise les mêmes options que pour l'Update pour rester cohérent
    private static readonly JsonSerializerOptions _optionsJson = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true
    };

    public GetAllControlesQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ControleDto>> Handle(GetAllControlesQuery request, CancellationToken cancellationToken)
    {
        // 1. On récupère les entités brutes de la base de données d'abord
        var entites = await _context.Controles
            .AsNoTracking()
            .OrderBy(c => c.Code)
            .ToListAsync(cancellationToken);

        // 2. On transforme les entités en DTO en mémoire (C# s'occupe de la désérialisation)
        return entites.Select(c => MapToDto(c)).ToList();
    }

    private ControleDto MapToDto(backend.Domain.Entities.Controle c)
    {
        return new ControleDto
        {
            Id = c.Id,
            Code = c.Code,
            Titre = c.Titre,
            Description = c.Description,
            Domaine = c.Domaine,
            Applicable = c.Applicable,
            RaisonExclusion = c.RaisonExclusion,
            Statut = c.Statut,
            JustificationConformite = c.JustificationConformite,
            Remarque = c.Remarque,
            Preuves = c.Preuves,
            Priorite = c.Priorite,
            StatutPlan = c.StatutPlan,
            ResponsablePlan = c.ResponsablePlan,
            DateEcheance = c.DateEcheance,
            DateMiseAJour = c.DateMiseAJour,
            DernierModificateurId = c.DernierModificateurId,
            DernierModificateurNom = c.DernierModificateurNom,

            // TRANSFORMATION DU TEXTE SQL -> LISTE POUR REACT
            RaisonsApplicabilite = ParseRaisonsApplicabilite(c.RaisonsApplicabilite),

            // TRANSFORMATION DU TEXTE SQL -> OBJET/TABLEAU POUR REACT
            Steps = ParseSteps(c.Steps)
        };
    }

    private static List<string> ParseRaisonsApplicabilite(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, _optionsJson) ?? new List<string>();
        }
        catch
        {
            try
            {
                var inner = JsonSerializer.Deserialize<string>(json, _optionsJson);
                return string.IsNullOrEmpty(inner)
                    ? new List<string>()
                    : JsonSerializer.Deserialize<List<string>>(inner, _optionsJson) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }

    private static object? ParseSteps(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;

        try
        {
            return JsonSerializer.Deserialize<object>(json, _optionsJson);
        }
        catch
        {
            try
            {
                var inner = JsonSerializer.Deserialize<string>(json, _optionsJson);
                return string.IsNullOrEmpty(inner)
                    ? null
                    : JsonSerializer.Deserialize<object>(inner, _optionsJson);
            }
            catch
            {
                return null;
            }
        }
    }
}