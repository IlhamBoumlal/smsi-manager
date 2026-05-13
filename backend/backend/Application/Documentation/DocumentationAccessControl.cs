using System.Globalization;
using System.Text;
using backend.Application.DTOs.Documentation;
using backend.Application.Security;
using backend.Domain.Entities;

namespace backend.Application.Documentation
{
    public enum DocumentationRole
    {
        SuperAdmin = 0,
        AdminSociete = 1,
        Rssi = 2,
        Consultant = 3,
        Auditeur = 4
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
            var canConsult = actor.HasIdentity && actor.HasSociete && actor.Role != DocumentationRole.SuperAdmin;
            var canManage = canConsult && actor.Role == DocumentationRole.Rssi;

            return new DocumentationPermissionsDto(
                Role: actor.Role.ToString().ToUpperInvariant(),
                CanConsult: canConsult,
                CanCreate: canManage,
                CanEditOwn: false,
                CanEditAny: canManage,
                CanDelete: canManage,
                CanApprove: canManage,
                CanCreateVersion: canManage,
                AllowedCategories: canConsult ? AllCategories : Array.Empty<string>()
            );
        }

        public static bool CanViewDocument(DocumentationActorContext actor, DocumentationDocument document)
        {
            if (!IsInSameSociete(actor, document)) return false;

            return actor.Role switch
            {
                DocumentationRole.SuperAdmin => false,
                _ => true
            };
        }

        public static bool CanCreateDocument(DocumentationActorContext actor, string? category, string? status)
        {
            if (!actor.HasIdentity || !actor.HasSociete) return false;

            var normalizedStatus = DocumentationHelpers.NormalizeStatus(status);
            if (normalizedStatus == "approuve" && actor.Role != DocumentationRole.Rssi)
                return false;

            return actor.Role == DocumentationRole.Rssi;
        }

        public static bool CanEditDocument(DocumentationActorContext actor, DocumentationDocument document, string? requestedCategory, string? requestedStatus)
        {
            if (!IsInSameSociete(actor, document)) return false;
            if (IsApprovedStatus(document.Status) && actor.Role != DocumentationRole.Rssi) return false;

            var normalizedStatus = DocumentationHelpers.NormalizeStatus(requestedStatus);
            if (normalizedStatus == "approuve" && actor.Role != DocumentationRole.Rssi)
                return false;

            return actor.Role == DocumentationRole.Rssi;
        }

        public static bool CanCreateVersionDocument(DocumentationActorContext actor, DocumentationDocument document)
        {
            if (!IsInSameSociete(actor, document)) return false;
            if (!IsApprovedStatus(document.Status)) return false;

            return actor.Role == DocumentationRole.Rssi;
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

            if (normalized.Contains(AppRoles.NormalizeKey(AppRoles.SuperAdmin)))
                return DocumentationRole.SuperAdmin;

            if (normalized.Contains(AppRoles.NormalizeKey(AppRoles.AdminSociete)))
                return DocumentationRole.AdminSociete;

            if (normalized.Contains(AppRoles.NormalizeKey(AppRoles.Rssi))
                || normalized.Contains("RESPONSABLESECURITE"))
                return DocumentationRole.Rssi;

            if (normalized.Contains(AppRoles.NormalizeKey(AppRoles.Auditeur)))
                return DocumentationRole.Auditeur;

            return DocumentationRole.Consultant;
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
