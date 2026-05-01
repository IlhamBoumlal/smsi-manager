using System.Security.Cryptography;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Services
{
    public class DocumentationProofLinkService : IDocumentationProofLinkService
    {
        private readonly AppDbContext _db;
        private readonly IFileStorageService _fileStorage;
        private readonly IWebHostEnvironment _environment;

        private const long MaxProofSizeBytes = 20 * 1024 * 1024;

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".ppt", ".pptx", ".txt", ".csv",
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
            ".zip", ".rar", ".7z"
        };

        private static readonly string[] SupportedDocumentTypes =
        [
            "Politique",
            "Procedure",
            "Plan",
            "Registre",
            "Rapport",
            "Charte",
            "Chart"
        ];

        public DocumentationProofLinkService(
            AppDbContext db,
            IFileStorageService fileStorage,
            IWebHostEnvironment environment)
        {
            _db = db;
            _fileStorage = fileStorage;
            _environment = environment;
        }

        public async Task<DocumentationDocument> FindOrCreateFromFormFileAndLinkAsync(
            IFormFile file,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? description,
            string? requestedType = null,
            string? sourceModule = null,
            string? controleDomaine = null,
            CancellationToken cancellationToken = default)
        {
            if (file is null || file.Length <= 0)
                throw new InvalidOperationException("Fichier vide ou manquant.");

            ValidateIncomingFile(file.FileName, file.Length);

            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);

            return await FindOrCreateFromBytesAndLinkAsync(
                ms.ToArray(),
                file.FileName,
                string.IsNullOrWhiteSpace(file.ContentType) ? null : file.ContentType,
                currentUserId,
                clauseReference,
                controleReference,
                description,
                requestedType,
                sourceModule,
                controleDomaine,
                cancellationToken);
        }

        public async Task<DocumentationDocument> FindOrCreateFromBytesAndLinkAsync(
            byte[] content,
            string originalFileName,
            string? contentType,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? description,
            string? requestedType = null,
            string? sourceModule = null,
            string? controleDomaine = null,
            CancellationToken cancellationToken = default)
        {
            if (content is null || content.Length == 0)
                throw new InvalidOperationException("Le contenu du fichier est vide.");

            var safeFileName = EnsureSafeFileName(originalFileName);
            ValidateIncomingFile(safeFileName, content.LongLength);

            var actor = await ResolveActorAsync(currentUserId, cancellationToken);
            var hash = ComputeSha256Hex(content);

            var existing = await FindExistingByHashAsync(
                actor.SocieteId,
                hash,
                content.LongLength,
                cancellationToken);

            if (existing is not null)
            {
                await EnsureDocumentLinksAsync(
                    existing,
                    actor.UserId,
                    clauseReference,
                    controleReference,
                    description,
                    requestedType,
                    sourceModule,
                    controleDomaine,
                    safeFileName,
                    cancellationToken);

                return existing;
            }

            await using var stream = new MemoryStream(content, writable: false);
            var upload = new FormFile(stream, 0, content.LongLength, "file", safeFileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = string.IsNullOrWhiteSpace(contentType) ? GuessContentTypeFromName(safeFileName) : contentType
            };

            var storedPath = await _fileStorage.SaveDocumentAsync(upload);
            if (string.IsNullOrWhiteSpace(storedPath))
                throw new InvalidOperationException("Impossible de sauvegarder le document preuve.");

            var now = DateTime.UtcNow;
            var resolvedType = ResolveDocumentType(safeFileName, description, requestedType);
            var resolvedCategory = ResolveDocumentCategory(
                clauseReference,
                sourceModule,
                controleDomaine,
                safeFileName,
                description);

            var document = new DocumentationDocument
            {
                SocieteId = actor.SocieteId,
                Name = BuildDocumentNameFromFile(safeFileName),
                Type = resolvedType,
                Category = resolvedCategory,
                Status = "brouillon",
                Version = "1.0",
                Classification = "Interne",
                Author = actor.DisplayName,
                Clause = MergeCsvLinks(null, clauseReference),
                Controle = MergeCsvLinks(null, controleReference),
                Description = string.IsNullOrWhiteSpace(description)
                    ? "Preuve documentaire ajoutee automatiquement depuis un module de conformite."
                    : description.Trim(),
                FilePath = storedPath,
                OriginalFileName = safeFileName,
                FileSizeBytes = content.LongLength,
                FileHash = hash,
                CreatedByUserId = actor.UserId,
                LastModifiedByUserId = actor.UserId,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.DocumentationDocuments.Add(document);
            await _db.SaveChangesAsync(cancellationToken);
            return document;
        }

        public async Task<DocumentationDocument?> LinkExistingDocumentAsync(
            Guid documentId,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? description,
            string? requestedType = null,
            string? sourceModule = null,
            string? controleDomaine = null,
            CancellationToken cancellationToken = default)
        {
            var actor = await ResolveActorAsync(currentUserId, cancellationToken);
            var document = await ScopeBySociete(actor.SocieteId)
                .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

            if (document is null) return null;

            await EnsureDocumentLinksAsync(
                document,
                actor.UserId,
                clauseReference,
                controleReference,
                description,
                requestedType,
                sourceModule,
                controleDomaine,
                document.OriginalFileName,
                cancellationToken);

            return document;
        }

        private async Task EnsureDocumentLinksAsync(
            DocumentationDocument document,
            string currentUserId,
            string? clauseReference,
            string? controleReference,
            string? description,
            string? requestedType,
            string? sourceModule,
            string? controleDomaine,
            string? originalFileName,
            CancellationToken cancellationToken)
        {
            var mergedClause = MergeCsvLinks(document.Clause, clauseReference);
            var mergedControle = MergeCsvLinks(document.Controle, controleReference);

            var mustUpdateDescription = string.IsNullOrWhiteSpace(document.Description) && !string.IsNullOrWhiteSpace(description);
            var mustUpdateType = string.IsNullOrWhiteSpace(document.Type);
            var mustUpdateCategory = string.IsNullOrWhiteSpace(document.Category);

            var referenceFileName = string.IsNullOrWhiteSpace(document.OriginalFileName)
                ? (string.IsNullOrWhiteSpace(originalFileName) ? document.Name : originalFileName)
                : document.OriginalFileName;

            var resolvedType = mustUpdateType
                ? ResolveDocumentType(referenceFileName, description, requestedType)
                : document.Type;

            var resolvedCategory = mustUpdateCategory
                ? ResolveDocumentCategory(mergedClause ?? clauseReference, sourceModule, controleDomaine, referenceFileName, description)
                : document.Category;

            var changed =
                !string.Equals(document.Clause ?? string.Empty, mergedClause ?? string.Empty, StringComparison.Ordinal) ||
                !string.Equals(document.Controle ?? string.Empty, mergedControle ?? string.Empty, StringComparison.Ordinal) ||
                !string.Equals(document.Type ?? string.Empty, resolvedType ?? string.Empty, StringComparison.Ordinal) ||
                !string.Equals(document.Category ?? string.Empty, resolvedCategory ?? string.Empty, StringComparison.Ordinal) ||
                mustUpdateDescription;

            if (!changed) return;

            document.Clause = mergedClause;
            document.Controle = mergedControle;
            document.Type = resolvedType ?? ResolveDocumentType(referenceFileName, description, requestedType);
            document.Category = resolvedCategory ?? "Audit";
            if (mustUpdateDescription) document.Description = description?.Trim();
            document.LastModifiedByUserId = currentUserId;
            document.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task<DocumentationDocument?> FindExistingByHashAsync(
            int? societeId,
            string fileHash,
            long fileSize,
            CancellationToken cancellationToken)
        {
            var scoped = ScopeBySociete(societeId);
            var existing = await scoped.FirstOrDefaultAsync(d => d.FileHash == fileHash, cancellationToken);
            if (existing is not null) return existing;

            var candidates = await scoped
                .Where(d =>
                    string.IsNullOrWhiteSpace(d.FileHash)
                    && d.FileSizeBytes.HasValue
                    && d.FileSizeBytes.Value == fileSize
                    && !string.IsNullOrWhiteSpace(d.FilePath))
                .ToListAsync(cancellationToken);

            var touched = false;
            DocumentationDocument? matched = null;

            foreach (var candidate in candidates)
            {
                var candidateHash = await TryComputeHashFromStoredPathAsync(candidate.FilePath, cancellationToken);
                if (string.IsNullOrWhiteSpace(candidateHash)) continue;

                candidate.FileHash = candidateHash;
                candidate.UpdatedAt = DateTime.UtcNow;
                touched = true;

                if (string.Equals(candidateHash, fileHash, StringComparison.OrdinalIgnoreCase))
                    matched = candidate;
            }

            if (touched)
                await _db.SaveChangesAsync(cancellationToken);

            return matched;
        }

        private IQueryable<DocumentationDocument> ScopeBySociete(int? societeId)
        {
            if (societeId.HasValue) return _db.DocumentationDocuments.Where(d => d.SocieteId == societeId);
            return _db.DocumentationDocuments.Where(d => d.SocieteId == null);
        }

        private async Task<(string UserId, int? SocieteId, string DisplayName)> ResolveActorAsync(
            string currentUserId,
            CancellationToken cancellationToken)
        {
            var userId = (currentUserId ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(userId))
                throw new InvalidOperationException("Utilisateur non authentifie.");

            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
                throw new InvalidOperationException("Utilisateur introuvable.");

            var displayName = string.IsNullOrWhiteSpace(user.NomComplet)
                ? (string.IsNullOrWhiteSpace(user.Email) ? userId : user.Email)
                : user.NomComplet;

            return (userId, user.SocieteId, displayName);
        }

        private async Task<string?> TryComputeHashFromStoredPathAsync(
            string? documentPath,
            CancellationToken cancellationToken)
        {
            var absolutePath = ResolveAbsoluteDocumentPath(documentPath);
            if (string.IsNullOrWhiteSpace(absolutePath) || !File.Exists(absolutePath))
                return null;

            await using var stream = File.OpenRead(absolutePath);
            using var sha = SHA256.Create();
            var hash = await sha.ComputeHashAsync(stream, cancellationToken);
            return Convert.ToHexString(hash);
        }

        private string? ResolveAbsoluteDocumentPath(string? storedPath)
        {
            if (string.IsNullOrWhiteSpace(storedPath)) return null;
            if (Path.IsPathRooted(storedPath)) return storedPath;

            var relative = storedPath.Trim().TrimStart('~').TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            return Path.Combine(webRoot, relative);
        }

        private static string ComputeSha256Hex(byte[] content)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(content));
        }

        private static void ValidateIncomingFile(string fileName, long size)
        {
            if (size <= 0) throw new InvalidOperationException("Fichier vide.");
            if (size > MaxProofSizeBytes) throw new InvalidOperationException("Fichier trop volumineux (max 20 Mo).");

            var extension = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
                throw new InvalidOperationException($"Extension non autorisee: {extension}");
        }

        private static string EnsureSafeFileName(string? originalFileName)
        {
            var fallback = $"preuve-{Guid.NewGuid():N}.bin";
            var candidate = string.IsNullOrWhiteSpace(originalFileName)
                ? fallback
                : Path.GetFileName(originalFileName.Trim());

            return string.IsNullOrWhiteSpace(candidate) ? fallback : candidate;
        }

        private static string BuildDocumentNameFromFile(string originalFileName)
        {
            var noExt = Path.GetFileNameWithoutExtension(originalFileName)?.Trim();
            return string.IsNullOrWhiteSpace(noExt) ? originalFileName : noExt;
        }

        private static string BuildDocumentTypeFromExtension(string? extension)
        {
            var ext = (extension ?? string.Empty).Trim().ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "Rapport",
                ".doc" or ".docx" => "Rapport",
                ".xls" or ".xlsx" or ".csv" => "Registre",
                ".ppt" or ".pptx" => "Plan",
                ".png" or ".jpg" or ".jpeg" or ".gif" or ".webp" or ".svg" => "Chart",
                ".txt" => "Procedure",
                _ => "Rapport"
            };
        }

        private static string ResolveDocumentType(
            string? fileName,
            string? description,
            string? requestedType)
        {
            var normalizedRequested = NormalizeRequestedType(requestedType);
            if (!string.IsNullOrWhiteSpace(normalizedRequested))
                return normalizedRequested;

            var searchText = BuildSearchText(fileName, description);
            var fromKeywords = BuildDocumentTypeFromKeywords(searchText);
            if (!string.IsNullOrWhiteSpace(fromKeywords))
                return fromKeywords;

            return BuildDocumentTypeFromExtension(Path.GetExtension(fileName ?? string.Empty));
        }

        private static string ResolveDocumentCategory(
            string? clauseReference,
            string? sourceModule,
            string? controleDomaine,
            string? fileName,
            string? description)
        {
            var searchText = BuildSearchText(fileName, description);

            if (ContainsAny(searchText, "rgpd", "gdpr", "privacy", "donnees personnelles", "donnees perso", "dpo"))
                return "RGPD";

            if (string.Equals(sourceModule?.Trim(), "controle", StringComparison.OrdinalIgnoreCase))
            {
                var domaine = (controleDomaine ?? string.Empty).Trim().ToLowerInvariant();
                if (domaine == "organisationnel") return "Gouvernance";
                if (domaine == "personnes") return "RH";
                if (domaine == "physique" || domaine == "technologique") return "Technique";
            }

            var clauseFamily = ParseClauseFamily(clauseReference);
            if (clauseFamily is 4 or 5 or 6) return "Gouvernance";
            if (clauseFamily == 7) return "RH";
            if (clauseFamily == 8) return "Technique";
            if (clauseFamily is 9 or 10) return "Audit";

            if (ContainsAny(searchText, "continuite", "pca", "pra", "reprise", "disaster recovery", "business continuity", "sauvegarde"))
                return "Continuite";

            if (ContainsAny(searchText, "ressources humaines", "formation", "sensibilisation", "employe", "collaborateur"))
                return "RH";

            if (ContainsAny(searchText, "technique", "infrastructure", "reseau", "serveur", "systeme", "application"))
                return "Technique";

            if (ContainsAny(searchText, "gouvernance", "comite", "direction", "pilotage", "strategie"))
                return "Gouvernance";

            return "Audit";
        }

        private static string? NormalizeRequestedType(string? requestedType)
        {
            var value = (requestedType ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(value)) return null;

            foreach (var knownType in SupportedDocumentTypes)
            {
                if (string.Equals(knownType, value, StringComparison.OrdinalIgnoreCase))
                    return knownType;
            }

            return null;
        }

        private static string? BuildDocumentTypeFromKeywords(string searchText)
        {
            if (ContainsAny(searchText, "procedure", "instruction", "mode operatoire"))
                return "Procedure";

            if (ContainsAny(searchText, "plan", "roadmap", "pca", "pra", "plan d'action", "plan action"))
                return "Plan";

            if (ContainsAny(searchText, "registre", "register", "journal", "inventaire", "logbook"))
                return "Registre";

            if (ContainsAny(searchText, "politique", "policy"))
                return "Politique";

            if (ContainsAny(searchText, "charte", "charter", "code de conduite"))
                return "Charte";

            if (ContainsAny(searchText, "chart", "graph", "dashboard", "courbe", "histogramme", "statistique"))
                return "Chart";

            if (ContainsAny(searchText, "rapport", "report", "audit", "compte rendu", "bilan", "pv"))
                return "Rapport";

            return null;
        }

        private static string BuildSearchText(string? fileName, string? description)
        {
            var left = (fileName ?? string.Empty).Trim();
            var right = (description ?? string.Empty).Trim();
            return $"{left} {right}".ToLowerInvariant();
        }

        private static int? ParseClauseFamily(string? clauseReference)
        {
            foreach (var token in ParseCsvTokens(clauseReference))
            {
                var mainPart = token.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .FirstOrDefault();

                if (string.IsNullOrWhiteSpace(mainPart))
                    continue;

                var digits = new string(mainPart.TakeWhile(char.IsDigit).ToArray());
                if (int.TryParse(digits, out var number))
                    return number;
            }

            return null;
        }

        private static bool ContainsAny(string haystack, params string[] needles)
        {
            if (string.IsNullOrWhiteSpace(haystack)) return false;
            foreach (var needle in needles)
            {
                if (!string.IsNullOrWhiteSpace(needle)
                    && haystack.Contains(needle, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        private static string GuessContentTypeFromName(string fileName)
        {
            var ext = Path.GetExtension(fileName)?.ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".svg" => "image/svg+xml",
                ".txt" => "text/plain",
                ".csv" => "text/csv",
                ".zip" => "application/zip",
                ".rar" => "application/vnd.rar",
                ".7z" => "application/x-7z-compressed",
                _ => "application/octet-stream"
            };
        }

        private static string? MergeCsvLinks(string? current, string? toAdd)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var token in ParseCsvTokens(current))
                set.Add(token);
            foreach (var token in ParseCsvTokens(toAdd))
                set.Add(token);

            if (set.Count == 0) return null;
            return string.Join(", ", set.OrderBy(value => value, StringComparer.OrdinalIgnoreCase));
        }

        private static IEnumerable<string> ParseCsvTokens(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) yield break;

            var tokens = value
                .Split([',', ';', '|', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var token in tokens)
            {
                var normalized = token.Trim();
                if (!string.IsNullOrWhiteSpace(normalized))
                    yield return normalized;
            }
        }
    }
}
