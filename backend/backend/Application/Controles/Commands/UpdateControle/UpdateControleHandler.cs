using System.Text.Encodings.Web;
using System.Text.Json;
using backend.Application.DTOs.Controles;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Controles.Commands.UpdateControle;

public class UpdateControleCommandHandler
    : IRequestHandler<UpdateControleCommand, (bool Success, string? Error, ControleDto? Data)>
{
    private readonly AppDbContext _context;
    private readonly IDocumentationProofLinkService _documentationProofLinkService;

    private const long MaxProofSizeBytes = 20 * 1024 * 1024;

    private static readonly JsonSerializerOptions _optionsJson = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        PropertyNameCaseInsensitive = true
    };

    public UpdateControleCommandHandler(
        AppDbContext context,
        IDocumentationProofLinkService documentationProofLinkService)
    {
        _context = context;
        _documentationProofLinkService = documentationProofLinkService;
    }

    public async Task<(bool Success, string? Error, ControleDto? Data)> Handle(
        UpdateControleCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var entite = await _context.Controles
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

            if (entite is null)
                return (false, "Contrôle non trouvé", null);

            var modifierId = NormalizeText(request.ModifierId) ?? NormalizeText(entite.DernierModificateurId);
            if (string.IsNullOrWhiteSpace(modifierId))
                return (false, "Utilisateur non identifié pour la mise à jour du contrôle.", null);

            var preuveReferences = await NormalizeAndLinkProofsAsync(
                request.Preuves,
                modifierId,
                entite.Code,
                entite.Domaine.ToString(),
                cancellationToken);

            if (request.Applicable && request.Statut == Statut.Conforme && preuveReferences.Count == 0)
                return (false, "Pour enregistrer un contrôle conforme, ajoutez au moins une preuve documentaire.", null);

            var preuvesJson = JsonSerializer.Serialize(preuveReferences, _optionsJson);

            // Snapshot avant
            var avantJson = TakeSnapshot(entite);

            // Application des modifications
            entite.Titre = request.Titre;
            entite.Description = request.Description;
            entite.Domaine = request.Domaine;
            entite.Applicable = request.Applicable;
            entite.Statut = request.Statut;

            if (request.Applicable)
            {
                entite.RaisonExclusion = null;
                entite.RaisonsApplicabilite = request.RaisonsApplicabilite is not null
                    ? JsonSerializer.Serialize(request.RaisonsApplicabilite, _optionsJson)
                    : null;

                switch (request.Statut)
                {
                    case Statut.Conforme:
                        entite.JustificationConformite = request.JustificationConformite;
                        entite.Remarque = null;
                        entite.Preuves = preuvesJson;
                        ResetPlanAction(entite);
                        break;

                    case Statut.Remarque:
                        entite.Remarque = request.Remarque;
                        entite.JustificationConformite = null;
                        entite.Preuves = preuvesJson;
                        ResetPlanAction(entite);
                        break;

                    case Statut.NCMineure:
                    case Statut.NCMajeure:
                        entite.JustificationConformite = null;
                        entite.Remarque = null;
                        entite.Preuves = preuvesJson;
                        entite.Priorite = request.Priorite;
                        entite.ResponsablePlan = request.ResponsablePlan;
                        entite.StatutPlan = request.StatutPlan;
                        entite.DateEcheance = request.DateEcheance;
                        entite.Steps = request.Steps is not null
                            ? JsonSerializer.Serialize(request.Steps, _optionsJson)
                            : null;
                        break;

                    default:
                        entite.JustificationConformite = null;
                        entite.Remarque = null;
                        entite.Preuves = preuvesJson;
                        ResetPlanAction(entite);
                        break;
                }
            }
            else
            {
                entite.RaisonExclusion = request.RaisonExclusion;
                entite.RaisonsApplicabilite = null;
                entite.Preuves = "[]";
                ResetPlanAction(entite);
            }

            entite.DateMiseAJour = DateTime.UtcNow;
            entite.DernierModificateurId = modifierId;
            entite.DernierModificateurNom = NormalizeText(request.ModifierNom) ?? request.ModifierId;

            // Snapshot après
            var apresJson = TakeSnapshot(entite);
            var champsModifies = DetecterChangements(avantJson, apresJson);

            _context.ControleHistoriques.Add(new ControleHistorique
            {
                ControleId = entite.Id,
                DateModification = entite.DateMiseAJour!.Value,
                ModificateurId = entite.DernierModificateurId,
                ModificateurNom = entite.DernierModificateurNom,
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

    private async Task<List<Dictionary<string, object?>>> NormalizeAndLinkProofsAsync(
        string? rawPreuves,
        string modifierId,
        string controleCode,
        string controleDomaine,
        CancellationToken cancellationToken)
    {
        var payloads = ParseIncomingProofPayloads(rawPreuves);
        var linkedProofs = new List<Dictionary<string, object?>>();
        var seenDocuments = new HashSet<Guid>();

        foreach (var payload in payloads)
        {
            DocumentationDocument? linkedDocument = null;

            if (TryParseGuid(payload.DocumentationId, out var documentationId))
            {
                linkedDocument = await _documentationProofLinkService.LinkExistingDocumentAsync(
                    documentationId,
                    modifierId,
                    clauseReference: null,
                    controleReference: controleCode,
                    payload.Description,
                    payload.DocumentType,
                    sourceModule: "Controle",
                    controleDomaine: controleDomaine,
                    cancellationToken);
            }

            if (linkedDocument is null
                && !string.IsNullOrWhiteSpace(payload.Data)
                && !string.IsNullOrWhiteSpace(payload.Name))
            {
                var bytes = DecodeBase64(payload.Data!);
                if (bytes.Length > MaxProofSizeBytes)
                    throw new InvalidOperationException("Une preuve depasse la taille maximale autorisee (20 Mo).");

                linkedDocument = await _documentationProofLinkService.FindOrCreateFromBytesAndLinkAsync(
                    bytes,
                    payload.Name!,
                    payload.ContentType,
                    modifierId,
                    clauseReference: null,
                    controleReference: controleCode,
                    payload.Description,
                    payload.DocumentType,
                    sourceModule: "Controle",
                    controleDomaine: controleDomaine,
                    cancellationToken);
            }

            if (linkedDocument is null || !seenDocuments.Add(linkedDocument.Id))
                continue;

            var proofName = !string.IsNullOrWhiteSpace(payload.Name)
                ? payload.Name!.Trim()
                : (linkedDocument.OriginalFileName ?? linkedDocument.Name);

            linkedProofs.Add(new Dictionary<string, object?>
            {
                ["documentationId"] = linkedDocument.Id,
                ["name"] = proofName,
                ["fileHash"] = linkedDocument.FileHash,
                ["downloadUrl"] = $"/api/documentation/{linkedDocument.Id}/file",
                ["contentType"] = payload.ContentType,
                ["fileSize"] = linkedDocument.FileSizeBytes,
                ["documentType"] = linkedDocument.Type
            });
        }

        return linkedProofs;
    }

    private static List<IncomingProofPayload> ParseIncomingProofPayloads(string? rawPreuves)
    {
        var results = new List<IncomingProofPayload>();
        if (string.IsNullOrWhiteSpace(rawPreuves)) return results;

        try
        {
            using var json = JsonDocument.Parse(rawPreuves);
            if (json.RootElement.ValueKind != JsonValueKind.Array) return results;

            foreach (var element in json.RootElement.EnumerateArray())
            {
                if (element.ValueKind != JsonValueKind.Object) continue;

                var payload = new IncomingProofPayload
                {
                    DocumentationId = ReadString(element, "documentationId", "DocumentationId"),
                    Name = ReadString(element, "name", "Name", "originalName", "OriginalName", "fileName", "FileName"),
                    Data = ReadString(element, "data", "Data", "base64", "Base64"),
                    ContentType = ReadString(element, "contentType", "ContentType", "mimeType", "MimeType"),
                    Description = ReadString(element, "description", "Description"),
                    DocumentType = ReadString(element, "documentType", "DocumentType", "type", "Type")
                };

                if (string.IsNullOrWhiteSpace(payload.DocumentationId)
                    && string.IsNullOrWhiteSpace(payload.Name)
                    && string.IsNullOrWhiteSpace(payload.Data))
                {
                    continue;
                }

                results.Add(payload);
            }
        }
        catch
        {
            // Ancien format ou valeur non JSON: on ignore.
        }

        return results;
    }

    private static string? ReadString(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (!element.TryGetProperty(name, out var value)) continue;
            if (value.ValueKind != JsonValueKind.String) continue;

            var text = value.GetString();
            if (!string.IsNullOrWhiteSpace(text)) return text.Trim();
        }

        return null;
    }

    private static bool TryParseGuid(string? value, out Guid guid)
        => Guid.TryParse((value ?? string.Empty).Trim(), out guid);

    private static byte[] DecodeBase64(string rawData)
    {
        var value = rawData.Trim();
        var commaIndex = value.IndexOf(',');
        if (commaIndex >= 0 && value.Contains("base64", StringComparison.OrdinalIgnoreCase))
            value = value[(commaIndex + 1)..];

        return Convert.FromBase64String(value);
    }

    private static string? NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim();
    }

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
                var vApres = apres.TryGetValue(key, out var el) ? el.ToString() : string.Empty;
                if (vAvant != vApres) changed.Add(key);
            }

            return changed.Count == 0 ? "Aucun changement detecte" : string.Join(", ", changed);
        }
        catch
        {
            return "Modification enregistree";
        }
    }

    private static void ResetPlanAction(Controle entite)
    {
        entite.Steps = null;
        entite.Priorite = null;
        entite.StatutPlan = null;
        entite.ResponsablePlan = null;
        entite.DateEcheance = null;
    }

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
            catch
            {
                return [];
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

    private sealed class IncomingProofPayload
    {
        public string? DocumentationId { get; init; }
        public string? Name { get; init; }
        public string? Data { get; init; }
        public string? ContentType { get; init; }
        public string? Description { get; init; }
        public string? DocumentType { get; init; }
    }
}
