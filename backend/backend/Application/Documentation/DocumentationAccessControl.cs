using System.Globalization;
using System.Text;
using backend.Application.DTOs.Documentation;
using backend.Domain.Entities;

namespace backend.Application.Documentation
{
    public enum DocumentationRole
    {
        Employe = 0,
        Dsi = 1,
        Drh = 2,
        Rssi = 3
    }

    public sealed record DocumentationActorContext(
        string UserId,
        int? SocieteId,
        DocumentationRole Role
    )
    {
        public bool HasIdentity => !string.IsNullOrWhiteSpace(UserId);
        public bool HasSociete => SocieteId.HasValue && SocieteId.Value > 0;
    }

    public static class DocumentationAccessControl
    {
        private static readonly string[] AllCategories = ["Gouvernance", "RGPD", "Continuite", "Technique", "RH", "Audit"];
        private static readonly string[] DrhCategories = ["RH"];
        private static readonly string[] DsiCategories = ["Technique", "Gouvernance"];

        public static DocumentationActorContext BuildActorContext(string? userId, int? societeId, IEnumerable<string>? roles)
        {
            return new DocumentationActorContext(
                userId?.Trim() ?? string.Empty,
                societeId,
                ResolveRole(roles)
            );
        }

        public static DocumentationPermissionsDto BuildModulePermissions(DocumentationActorContext actor)
        {
            var allowedCategories = actor.Role switch
            {
                DocumentationRole.Rssi => AllCategories,
                DocumentationRole.Drh => DrhCategories,
                DocumentationRole.Dsi => DsiCategories,
                _ => Array.Empty<string>()
            };

            return new DocumentationPermissionsDto(
                Role: actor.Role.ToString().ToUpperInvariant(),
                CanConsult: actor.HasIdentity && actor.HasSociete,
                CanCreate: actor.HasIdentity && actor.HasSociete && actor.Role is DocumentationRole.Rssi or DocumentationRole.Drh or DocumentationRole.Dsi,
                CanEditOwn: actor.HasIdentity && actor.HasSociete && actor.Role is DocumentationRole.Drh or DocumentationRole.Dsi,
                CanEditAny: actor.HasIdentity && actor.HasSociete && actor.Role == DocumentationRole.Rssi,
                CanDelete: actor.HasIdentity && actor.HasSociete && actor.Role == DocumentationRole.Rssi,
                CanApprove: actor.HasIdentity && actor.HasSociete && actor.Role == DocumentationRole.Rssi,
                CanCreateVersion: actor.HasIdentity && actor.HasSociete && actor.Role is DocumentationRole.Rssi or DocumentationRole.Drh or DocumentationRole.Dsi,
                AllowedCategories: allowedCategories
            );
        }

        public static bool CanViewDocument(DocumentationActorContext actor, DocumentationDocument document)
        {
            if (!IsInSameSociete(actor, document)) return false;

            return actor.Role switch
            {
                DocumentationRole.Rssi => true,
                DocumentationRole.Drh => IsCategoryAllowed(document.Category, DrhCategories),
                DocumentationRole.Dsi => IsCategoryAllowed(document.Category, DsiCategories),
                _ => IsApprovedStatus(document.Status)
            };
        }

        public static bool CanCreateDocument(DocumentationActorContext actor, string? category, string? status)
        {
            if (!actor.HasIdentity || !actor.HasSociete) return false;

            var normalizedStatus = DocumentationHelpers.NormalizeStatus(status);
            if (normalizedStatus == "approuve" && actor.Role != DocumentationRole.Rssi)
                return false;

            return actor.Role switch
            {
                DocumentationRole.Rssi => true,
                DocumentationRole.Drh => IsCategoryAllowed(category, DrhCategories),
                DocumentationRole.Dsi => IsCategoryAllowed(category, DsiCategories),
                _ => false
            };
        }

        public static bool CanEditDocument(DocumentationActorContext actor, DocumentationDocument document, string? requestedCategory, string? requestedStatus)
        {
            if (!IsInSameSociete(actor, document)) return false;
            if (IsApprovedStatus(document.Status) && actor.Role != DocumentationRole.Rssi) return false;

            var normalizedStatus = DocumentationHelpers.NormalizeStatus(requestedStatus);
            if (normalizedStatus == "approuve" && actor.Role != DocumentationRole.Rssi)
                return false;

            return actor.Role switch
            {
                DocumentationRole.Rssi => true,
                DocumentationRole.Drh => IsOwnedByActor(actor, document)
                    && IsCategoryAllowed(document.Category, DrhCategories)
                    && IsCategoryAllowed(requestedCategory, DrhCategories),
                DocumentationRole.Dsi => IsOwnedByActor(actor, document)
                    && IsCategoryAllowed(document.Category, DsiCategories)
                    && IsCategoryAllowed(requestedCategory, DsiCategories),
                _ => false
            };
        }

        public static bool CanCreateVersionDocument(DocumentationActorContext actor, DocumentationDocument document)
        {
            if (!IsInSameSociete(actor, document)) return false;
            if (!IsApprovedStatus(document.Status)) return false;

            return actor.Role switch
            {
                DocumentationRole.Rssi => true,
                DocumentationRole.Drh => IsCategoryAllowed(document.Category, DrhCategories),
                DocumentationRole.Dsi => IsCategoryAllowed(document.Category, DsiCategories),
                _ => false
            };
        }

        public static bool CanDeleteDocument(DocumentationActorContext actor, DocumentationDocument document)
        {
            return actor.Role == DocumentationRole.Rssi && IsInSameSociete(actor, document);
        }

        public static bool CanApproveDocument(DocumentationActorContext actor, DocumentationDocument document)
        {
            return actor.Role == DocumentationRole.Rssi && IsInSameSociete(actor, document);
        }

        public static bool IsOwnedByActor(DocumentationActorContext actor, DocumentationDocument document)
        {
            return actor.HasIdentity && string.Equals(document.CreatedByUserId, actor.UserId, StringComparison.Ordinal);
        }

        private static DocumentationRole ResolveRole(IEnumerable<string>? roles)
        {
            var normalized = roles?
                .Select(NormalizeKey)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToHashSet(StringComparer.OrdinalIgnoreCase)
                ?? [];

            if (normalized.Contains("RSSI") || normalized.Contains("ADMIN") || normalized.Contains("RESPONSABLESECURITE"))
                return DocumentationRole.Rssi;

            if (normalized.Contains("DRH"))
                return DocumentationRole.Drh;

            if (normalized.Contains("DSI"))
                return DocumentationRole.Dsi;

            return DocumentationRole.Employe;
        }

        private static bool IsInSameSociete(DocumentationActorContext actor, DocumentationDocument document)
        {
            return actor.HasIdentity
                && actor.HasSociete
                && document.SocieteId.HasValue
                && document.SocieteId.Value == actor.SocieteId;
        }

        private static bool IsApprovedStatus(string? status)
        {
            return string.Equals(
                DocumentationHelpers.NormalizeStatus(status),
                "approuve",
                StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsCategoryAllowed(string? category, IReadOnlyCollection<string> allowedCategories)
        {
            if (string.IsNullOrWhiteSpace(category)) return false;
            var normalizedCategory = NormalizeKey(category);
            return allowedCategories.Any(c => NormalizeKey(c) == normalizedCategory);
        }

        private static string NormalizeKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = value.Trim().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                {
                    if (!char.IsWhiteSpace(ch) && ch != '-' && ch != '_')
                        sb.Append(char.ToUpperInvariant(ch));
                }
            }

            return sb.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
