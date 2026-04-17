using backend.Application.DTOs.Controles;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Encodings.Web;

namespace backend.Application.Controles.Queries.GetAllControles;

public class GetAllControlesHandler : IRequestHandler<GetAllControlesQuery, List<ControleDto>>
{
    private readonly AppDbContext _context;

    // Options pour la désérialisation (doit correspondre aux options de l'Update)
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true
    };

    public GetAllControlesHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ControleDto>> Handle(GetAllControlesQuery request, CancellationToken cancellationToken)
    {
        // 1. On récupère les données brutes (Entities) depuis SQL Server
        var entites = await _context.Controles
            .AsNoTracking()
            .OrderBy(c => c.Code)
            .ToListAsync(cancellationToken);

        // 2. On transforme les Entities en DTOs en mémoire pour gérer le JSON
        var dtos = entites.Select(c => new ControleDto
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

            // DÉSÉRIALISATION : Texte SQL -> Liste de strings pour React
            RaisonsApplicabilite = string.IsNullOrEmpty(c.RaisonsApplicabilite)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(c.RaisonsApplicabilite, _jsonOptions),

            // DÉSÉRIALISATION : Texte SQL -> Objet/Tableau pour React
            Steps = string.IsNullOrEmpty(c.Steps)
                ? null
                : JsonSerializer.Deserialize<object>(c.Steps, _jsonOptions)
        }).ToList();

        return dtos;
    }
}