using backend.Application.DTOs.Controles;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using backend.Domain.Entities;
using System.Text.Json;
using System.Text.Encodings.Web;

namespace backend.Application.Controles.Commands.UpdateControle;

public class UpdateControleCommandHandler
    : IRequestHandler<UpdateControleCommand, (bool Success, string? Error, ControleDto? Data)>
{
    private readonly AppDbContext _context;

    private static readonly JsonSerializerOptions _optionsJson = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true
    };

    public UpdateControleCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Success, string? Error, ControleDto? Data)> Handle(
        UpdateControleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var entite = await _context.Controles
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

            if (entite == null)
                return (false, "Contrôle non trouvé", null);

            // ── 1. Snapshot AVANT ────────────────────────────────────────────
            var avantJson = TakeSnapshot(entite);

            // ── 2. Appliquer les modifications ───────────────────────────────
            entite.Titre = request.Titre;
            entite.Description = request.Description;
            entite.Domaine = request.Domaine;
            entite.Applicable = request.Applicable;
            entite.Statut = request.Statut;

            if (request.Applicable)
            {
                entite.RaisonExclusion = null;
                entite.RaisonsApplicabilite = request.RaisonsApplicabilite != null
                    ? JsonSerializer.Serialize(request.RaisonsApplicabilite, _optionsJson)
                    : null;

                switch (request.Statut)
                {
                    case Statut.Conforme:
                        entite.JustificationConformite = request.JustificationConformite;
                        entite.Remarque = null;
                        ResetPlanAction(entite);
                        break;

                    case Statut.Remarque:
                        entite.Remarque = request.Remarque;
                        entite.JustificationConformite = null;
                        entite.Preuves = request.Preuves;
                        ResetPlanAction(entite);
                        break;

                    case Statut.NCMineure:
                    case Statut.NCMajeure:
                        entite.JustificationConformite = null;
                        entite.Remarque = null;
                        entite.Preuves = request.Preuves;
                        entite.Priorite = request.Priorite;
                        entite.ResponsablePlan = request.ResponsablePlan;
                        entite.StatutPlan = request.StatutPlan;
                        entite.DateEcheance = request.DateEcheance;
                        entite.Steps = request.Steps != null
                            ? JsonSerializer.Serialize(request.Steps, _optionsJson)
                            : null;
                        break;
                }
            }
            else
            {
                entite.RaisonExclusion = request.RaisonExclusion;
                entite.RaisonsApplicabilite = null;
                ResetPlanAction(entite);
            }

            entite.DateMiseAJour = DateTime.UtcNow;
            entite.DernierModificateurId = request.ModifierId;
            entite.DernierModificateurNom = request.ModifierNom;

            // ── 3. Snapshot APRÈS ────────────────────────────────────────────
            var apresJson = TakeSnapshot(entite);
            var champsModifies = DetecterChangements(avantJson, apresJson);

            // ── 4. Enregistrer dans l'historique ─────────────────────────────
            _context.ControleHistoriques.Add(new ControleHistorique
            {
                ControleId = entite.Id,
                DateModification = entite.DateMiseAJour!.Value,
                ModificateurId = request.ModifierId,
                ModificateurNom = request.ModifierNom,
                AvantJson = avantJson,
                ApresJson = apresJson,
                ChampsModifies = champsModifies,
            });

            await _context.SaveChangesAsync(cancellationToken);
            return (true, null, MapToDto(entite));
        }
        catch (Exception ex)
        {
            return (false, $"Erreur: {ex.Message}", null);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string TakeSnapshot(Controle c)
    {
        var snap = new
        {
            c.Applicable,
            c.Statut,
            c.RaisonsApplicabilite,
            c.RaisonExclusion,
            c.JustificationConformite,
            c.Remarque,
            c.Preuves,
            c.Priorite,
            c.StatutPlan,
            c.ResponsablePlan,
            c.DateEcheance,
            c.Steps,
        };
        return JsonSerializer.Serialize(snap, _optionsJson);
    }

    private static string DetecterChangements(string avantJson, string apresJson)
    {
        try
        {
            var avant = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(avantJson, _optionsJson)!;
            var apres = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(apresJson, _optionsJson)!;

            var changed = new List<string>();
            foreach (var key in avant.Keys)
            {
                var vAvant = avant[key].ToString();
                var vApres = apres.TryGetValue(key, out var el) ? el.ToString() : "";
                if (vAvant != vApres)
                    changed.Add(key);
            }
            return changed.Count == 0 ? "Aucun changement détecté" : string.Join(", ", changed);
        }
        catch
        {
            return "Modification enregistrée";
        }
    }

    private void ResetPlanAction(Controle entite)
    {
        entite.Steps = null;
        entite.Priorite = null;
        entite.StatutPlan = null;
        entite.ResponsablePlan = null;
        entite.DateEcheance = null;
    }

    // ── MapToDto ──────────────────────────────────────────────────────────────

    private ControleDto MapToDto(Controle c) => new()
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
        RaisonsApplicabilite = ParseRaisonsApplicabilite(c.RaisonsApplicabilite),
        Steps = ParseSteps(c.Steps),
    };

    private static List<string> ParseRaisonsApplicabilite(string? json)
    {
        if (string.IsNullOrEmpty(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, _optionsJson) ?? [];
        }
        catch
        {
            try
            {
                var inner = JsonSerializer.Deserialize<string>(json, _optionsJson);
                return string.IsNullOrEmpty(inner)
                    ? []
                    : JsonSerializer.Deserialize<List<string>>(inner, _optionsJson) ?? [];
            }
            catch { return []; }
        }
    }

    private static object? ParseSteps(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try { return JsonSerializer.Deserialize<object>(json, _optionsJson); }
        catch
        {
            try
            {
                var inner = JsonSerializer.Deserialize<string>(json, _optionsJson);
                return string.IsNullOrEmpty(inner)
                    ? null
                    : JsonSerializer.Deserialize<object>(inner, _optionsJson);
            }
            catch { return null; }
        }
    }
}