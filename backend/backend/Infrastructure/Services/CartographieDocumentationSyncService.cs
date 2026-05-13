using System.Security.Cryptography;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Services
{
    public class CartographieDocumentationSyncService : ICartographieDocumentationSyncService
    {
        private readonly AppDbContext _db;
        private readonly IDocumentationProofLinkService _proofLinkService;

        private const string CartographieDescriptionPrefix =
            "Document synchronise automatiquement depuis la cartographie.";

        public CartographieDocumentationSyncService(
            AppDbContext db,
            IDocumentationProofLinkService proofLinkService)
        {
            _db = db;
            _proofLinkService = proofLinkService;
        }

        public async Task SyncOnDocumentAddedAsync(
            Processus processus,
            Document document,
            string currentUserId,
            CancellationToken cancellationToken = default)
        {
            if (!IsSyncableActor(currentUserId) || !processus.SocieteId.HasValue)
                return;

            var processusReference = Safe(processus.Nom);
            if (string.IsNullOrWhiteSpace(processusReference))
                return;

            var description = BuildCartographieDescription(processus, document);

            if (document.FichierData is { Length: > 0 } fileBytes && !string.IsNullOrWhiteSpace(document.FichierNom))
            {
                await _proofLinkService.FindOrCreateFromBytesAndLinkAsync(
                    fileBytes,
                    document.FichierNom!,
                    document.FichierType,
                    currentUserId,
                    clauseReference: null,
                    controleReference: null,
                    processusReference: processusReference,
                    description: description,
                    requestedType: ResolveDocumentationType(document.Type),
                    sourceModule: "cartographie",
                    controleDomaine: null,
                    cancellationToken: cancellationToken);
                return;
            }

            await UpsertMetadataOnlyDocumentationAsync(
                processus,
                document,
                currentUserId,
                processusReference,
                description,
                cancellationToken);
        }

        public async Task SyncOnDocumentRemovedAsync(
            Processus processus,
            Document document,
            string currentUserId,
            CancellationToken cancellationToken = default)
        {
            if (!processus.SocieteId.HasValue) return;

            var processusReference = Safe(processus.Nom);
            if (string.IsNullOrWhiteSpace(processusReference)) return;

            var scoped = ScopeBySociete(processus.SocieteId);
            IQueryable<DocumentationDocument> query;

            var hash = ComputeSha256Hex(document.FichierData);
            if (!string.IsNullOrWhiteSpace(hash))
            {
                query = scoped.Where(d => d.FileHash == hash);
            }
            else
            {
                var normalizedName = Safe(document.Nom);
                var resolvedType = ResolveDocumentationType(document.Type);
                query = scoped.Where(d =>
                    d.Name == normalizedName
                    && d.Type == resolvedType
                    && string.IsNullOrWhiteSpace(d.FileHash));
            }

            var candidates = await query.ToListAsync(cancellationToken);
            if (candidates.Count == 0) return;

            var touched = false;
            foreach (var candidate in candidates)
            {
                var updatedProcessus = RemoveCsvToken(candidate.Processus, processusReference);
                if (string.Equals(updatedProcessus ?? string.Empty, candidate.Processus ?? string.Empty, StringComparison.Ordinal))
                    continue;

                candidate.Processus = updatedProcessus;
                candidate.LastModifiedByUserId = Safe(currentUserId);
                candidate.UpdatedAt = DateTime.UtcNow;
                touched = true;

                if (ShouldDeleteAfterUnlink(candidate))
                    _db.DocumentationDocuments.Remove(candidate);
            }

            if (touched)
                await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task SyncOnProcessusRenamedAsync(
            string oldProcessusName,
            string newProcessusName,
            int? societeId,
            string currentUserId,
            CancellationToken cancellationToken = default)
        {
            var oldName = Safe(oldProcessusName);
            var newName = Safe(newProcessusName);
            if (!societeId.HasValue || string.IsNullOrWhiteSpace(oldName) || string.IsNullOrWhiteSpace(newName))
                return;

            if (string.Equals(oldName, newName, StringComparison.OrdinalIgnoreCase))
                return;

            var candidates = await ScopeBySociete(societeId)
                .Where(d => !string.IsNullOrWhiteSpace(d.Processus) && d.Processus!.Contains(oldName))
                .ToListAsync(cancellationToken);

            if (candidates.Count == 0) return;

            var touched = false;
            foreach (var candidate in candidates)
            {
                var replaced = ReplaceCsvToken(candidate.Processus, oldName, newName);
                if (string.Equals(replaced ?? string.Empty, candidate.Processus ?? string.Empty, StringComparison.Ordinal))
                    continue;

                candidate.Processus = replaced;
                candidate.LastModifiedByUserId = Safe(currentUserId);
                candidate.UpdatedAt = DateTime.UtcNow;
                touched = true;
            }

            if (touched)
                await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task UpsertMetadataOnlyDocumentationAsync(
            Processus processus,
            Document document,
            string currentUserId,
            string processusReference,
            string description,
            CancellationToken cancellationToken)
        {
            var normalizedName = Safe(document.Nom);
            if (string.IsNullOrWhiteSpace(normalizedName))
                return;

            var resolvedType = ResolveDocumentationType(document.Type);
            var scoped = ScopeBySociete(processus.SocieteId);

            var existing = await scoped
                .Where(d =>
                    d.Name == normalizedName
                    && d.Type == resolvedType
                    && string.IsNullOrWhiteSpace(d.FileHash))
                .OrderByDescending(d => d.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (existing is not null)
            {
                var mergedProcessus = MergeCsvLinks(existing.Processus, processusReference);
                var changed =
                    !string.Equals(mergedProcessus ?? string.Empty, existing.Processus ?? string.Empty, StringComparison.Ordinal)
                    || (string.IsNullOrWhiteSpace(existing.Description) && !string.IsNullOrWhiteSpace(description));

                if (!changed) return;

                existing.Processus = mergedProcessus;
                if (string.IsNullOrWhiteSpace(existing.Description))
                    existing.Description = description;
                existing.LastModifiedByUserId = Safe(currentUserId);
                existing.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(cancellationToken);
                return;
            }

            var now = DateTime.UtcNow;
            var author = await ResolveActorDisplayNameAsync(currentUserId, cancellationToken);

            var created = new DocumentationDocument
            {
                Id = Guid.NewGuid(),
                SocieteId = processus.SocieteId,
                Name = normalizedName,
                Type = resolvedType,
                Category = ResolveDocumentationCategory(processus.Categorie),
                Status = "brouillon",
                Version = "1.0",
                Classification = "Interne",
                Author = author,
                Clause = null,
                Controle = null,
                Processus = processusReference,
                Description = description,
                CreatedByUserId = Safe(currentUserId),
                LastModifiedByUserId = Safe(currentUserId),
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.DocumentationDocuments.Add(created);
            await _db.SaveChangesAsync(cancellationToken);
        }

        private IQueryable<DocumentationDocument> ScopeBySociete(int? societeId)
        {
            if (societeId.HasValue && societeId.Value > 0)
                return _db.DocumentationDocuments.Where(d => d.SocieteId == societeId.Value);

            return _db.DocumentationDocuments.Where(_ => false);
        }

        private async Task<string> ResolveActorDisplayNameAsync(string currentUserId, CancellationToken cancellationToken)
        {
            var userId = Safe(currentUserId);
            if (string.IsNullOrWhiteSpace(userId))
                return "Synchronisation cartographie";

            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null) return "Synchronisation cartographie";
            if (!string.IsNullOrWhiteSpace(user.NomComplet)) return user.NomComplet.Trim();
            if (!string.IsNullOrWhiteSpace(user.Email)) return user.Email.Trim();
            return userId;
        }

        private static string BuildCartographieDescription(Processus processus, Document document)
        {
            var reference = Safe(document.Reference);
            var processName = Safe(processus.Nom);
            return string.IsNullOrWhiteSpace(reference)
                ? $"{CartographieDescriptionPrefix} Processus: {processName}."
                : $"{CartographieDescriptionPrefix} Processus: {processName}. Reference: {reference}.";
        }

        private static string ResolveDocumentationType(string? cartographieType)
        {
            var normalized = Safe(cartographieType).ToLowerInvariant();
            return normalized switch
            {
                "procedure" or "procédure" or "instruction" => "Procedure",
                "plan" => "Plan",
                "registre" or "formulaire" => "Registre",
                "rapport" => "Rapport",
                "politique" => "Politique",
                _ => "Charte"
            };
        }

        private static string ResolveDocumentationCategory(string? cartographieCategorie)
        {
            var normalized = Safe(cartographieCategorie).ToLowerInvariant();
            return normalized switch
            {
                "mgmt" => "Gouvernance",
                "real" => "Technique",
                "supp" => "RH",
                _ => "Audit"
            };
        }

        private static string? ComputeSha256Hex(byte[]? content)
        {
            if (content is null || content.Length == 0) return null;
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(content));
        }

        private static bool ShouldDeleteAfterUnlink(DocumentationDocument document)
        {
            var hasClause = !string.IsNullOrWhiteSpace(document.Clause);
            var hasControle = !string.IsNullOrWhiteSpace(document.Controle);
            var hasProcessus = !string.IsNullOrWhiteSpace(document.Processus);
            if (hasClause || hasControle || hasProcessus) return false;

            return !string.IsNullOrWhiteSpace(document.Description)
                && document.Description.StartsWith(CartographieDescriptionPrefix, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsSyncableActor(string? currentUserId)
            => !string.IsNullOrWhiteSpace(Safe(currentUserId));

        private static string Safe(string? value)
            => (value ?? string.Empty).Trim();

        private static string? MergeCsvLinks(string? current, string? toAdd)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var token in ParseCsvTokens(current))
                set.Add(token);
            foreach (var token in ParseCsvTokens(toAdd))
                set.Add(token);

            if (set.Count == 0) return null;
            return string.Join(", ", set.OrderBy(v => v, StringComparer.OrdinalIgnoreCase));
        }

        private static string? RemoveCsvToken(string? current, string tokenToRemove)
        {
            if (string.IsNullOrWhiteSpace(current)) return null;
            var target = Safe(tokenToRemove);
            if (string.IsNullOrWhiteSpace(target)) return current;

            var remaining = ParseCsvTokens(current)
                .Where(token => !string.Equals(token, target, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(v => v, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return remaining.Count == 0 ? null : string.Join(", ", remaining);
        }

        private static string? ReplaceCsvToken(string? current, string oldToken, string newToken)
        {
            if (string.IsNullOrWhiteSpace(current)) return null;
            var oldValue = Safe(oldToken);
            var newValue = Safe(newToken);
            if (string.IsNullOrWhiteSpace(oldValue) || string.IsNullOrWhiteSpace(newValue))
                return current;

            var values = ParseCsvTokens(current)
                .Select(token => string.Equals(token, oldValue, StringComparison.OrdinalIgnoreCase) ? newValue : token)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(v => v, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return values.Count == 0 ? null : string.Join(", ", values);
        }

        private static IEnumerable<string> ParseCsvTokens(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) yield break;

            var tokens = value
                .Split([',', ';', '|', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var token in tokens)
            {
                var normalized = Safe(token);
                if (!string.IsNullOrWhiteSpace(normalized))
                    yield return normalized;
            }
        }
    }
}
