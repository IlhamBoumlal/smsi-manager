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
            Console.WriteLine($"DEBUG: UpdateControle - Id: {request.Id}, SocieteId: {request.SocieteId}, Statut: {request.Statut}, Applicable: {request.Applicable}");

            if (!request.SocieteId.HasValue)
                return (false, "Société non spécifiée", null);

            // D'abord essayer de trouver par ID exact (nouveau comportement)
            var entite = await _context.Controles
                .FirstOrDefaultAsync(c => c.Id == request.Id && c.SocieteId == request.SocieteId.Value, cancellationToken);

            Console.WriteLine($"DEBUG: Recherche par ID exact - Trouvé: {entite != null}");
            if (entite != null)
                Console.WriteLine($"DEBUG: Contrôle trouvé - Id: {entite.Id}, Code: {entite.Code}, SocieteId: {entite.SocieteId}, Statut actuel: {entite.Statut}");

            // Si pas trouvé et que c'est un ancien ID de contrôle global, chercher par code
            if (entite == null)
            {
                Console.WriteLine("DEBUG: Contrôle non trouvé par ID exact, recherche fallback...");
                var controleGlobal = await _context.Controles
                    .FirstOrDefaultAsync(c => c.Id == request.Id && c.SocieteId == null, cancellationToken);

                Console.WriteLine($"DEBUG: Contrôle global trouvé: {controleGlobal != null}");
                if (controleGlobal != null)
                {
                    Console.WriteLine($"DEBUG: Contrôle global - Code: {controleGlobal.Code}, recherche équivalent société...");
                    entite = await _context.Controles
                        .FirstOrDefaultAsync(c => c.Code == controleGlobal.Code && c.SocieteId == request.SocieteId.Value, cancellationToken);

                    Console.WriteLine($"DEBUG: Contrôle société trouvé par code: {entite != null}");
                    if (entite != null)
                        Console.WriteLine($"DEBUG: Contrôle société - Id: {entite.Id}, Statut actuel: {entite.Statut}");
                }
            }

            if (entite == null)
            {
                Console.WriteLine($"DEBUG: Contrôle non trouvé - Id: {request.Id}, SocieteId: {request.SocieteId}");
                return (false, "Contrôle non trouvé ou accès non autorisé", null);
            }

            Console.WriteLine($"DEBUG: Contrôle trouvé - Id: {entite.Id}, Code: {entite.Code}, SocieteId: {entite.SocieteId}");

            // ── 1. Snapshot AVANT ────────────────────────────────────────────
            var avantJson = TakeSnapshot(entite);
            Console.WriteLine($"DEBUG: Statut AVANT: {entite.Statut}");

            // ── 2. Appliquer les modifications ───────────────────────────────
            entite.Titre = request.Titre;
            entite.Description = request.Description;
            entite.Domaine = request.Domaine;
            entite.Applicable = request.Applicable;
            entite.Statut = request.Statut;
            Console.WriteLine($"DEBUG: Statut assigné: {entite.Statut} (demandé: {request.Statut})");

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
                        entite.Preuves = request.Preuves;
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
                entite.Statut = Statut.NonEvalue;
                ResetPlanAction(entite);
            }

            entite.DateMiseAJour = DateTime.UtcNow;
            entite.DernierModificateurId = request.ModifierId;
            entite.DernierModificateurNom = request.ModifierNom;

            // ── 3. Snapshot APRÈS ────────────────────────────────────────────
            var apresJson = TakeSnapshot(entite);
            Console.WriteLine($"DEBUG: Statut APRÈS modifications: {entite.Statut}");
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

            Console.WriteLine($"DEBUG: Avant SaveChangesAsync - Statut: {entite.Statut}, Applicable: {entite.Applicable}");
            await _context.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"DEBUG: Après SaveChangesAsync - Statut en mémoire: {entite.Statut}");
            Console.WriteLine($"DEBUG: État du contexte - IsModified: {_context.Entry(entite).State}");

            var dto = MapToDto(entite);
            Console.WriteLine($"DEBUG: DTO retourné - Statut: {dto.Statut}");

            return (true, null, dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DEBUG ERROR: Exception lors de UpdateControle: {ex.Message}");
            Console.WriteLine($"DEBUG ERROR: StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
                Console.WriteLine($"DEBUG ERROR: Inner Exception: {ex.InnerException.Message}");
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