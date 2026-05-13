using System.Globalization;
using System.Text;

namespace backend.Application.Security
{
    public static class AppRoles
    {
        private const string TenantRolePrefix = "TENANT_ROLE::";

        public const string SuperAdmin = "Super Admin";
        public const string AdminSociete = "Admin Societe";
        public const string Auditeur = "Auditeur";
        public const string Consultant = "Consultant";
        public const string Rssi = "RSSI";

        public const string SuperAdminRoleKey = "SUPER_ADMIN";
        public const string AdminSocieteRoleKey = "ADMIN_SOCIETE";
        public const string RssiRoleKey = "RSSI";
        public const string ConsultantRoleKey = "CONSULTANT";
        public const string AuditeurRoleKey = "AUDITEUR";

        public const string AdminScopes = SuperAdmin + "," + AdminSociete;
        public const string SocieteScopes = AdminSociete + "," + Rssi + "," + Auditeur + "," + Consultant;

        public static readonly string[] FinalRoles =
        [
            SuperAdmin,
            AdminSociete,
            Auditeur,
            Consultant,
            Rssi
        ];

        private static readonly string SuperAdminKey = NormalizeKey(SuperAdmin);
        private static readonly string AdminSocieteKey = NormalizeKey(AdminSociete);
        private static readonly string AuditeurKey = NormalizeKey(Auditeur);
        private static readonly string ConsultantKey = NormalizeKey(Consultant);
        private static readonly string RssiKey = NormalizeKey(Rssi);

        private static readonly HashSet<string> FinalRoleKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            SuperAdminKey,
            AdminSocieteKey,
            AuditeurKey,
            ConsultantKey,
            RssiKey
        };

        public static readonly string[] FinalPrimaryRoleKeys =
        [
            SuperAdminRoleKey,
            AdminSocieteRoleKey,
            RssiRoleKey,
            ConsultantRoleKey,
            AuditeurRoleKey
        ];

        public static bool IsFinalRole(string? roleName)
        {
            return FinalRoleKeys.Contains(NormalizeKey(roleName));
        }

        public static bool IsSuperAdminRole(string? roleName)
        {
            return string.Equals(NormalizeKey(roleName), SuperAdminKey, StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsSocieteRequiredRole(string? roleName)
        {
            return !IsSuperAdminRole(roleName);
        }

        public static bool IsSuperAdminRoleKey(string? roleKey)
        {
            return string.Equals(roleKey, SuperAdminRoleKey, StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsSocieteScopedRoleKey(string? roleKey)
        {
            if (string.IsNullOrWhiteSpace(roleKey))
            {
                return false;
            }

            return string.Equals(roleKey, AdminSocieteRoleKey, StringComparison.OrdinalIgnoreCase)
                || string.Equals(roleKey, RssiRoleKey, StringComparison.OrdinalIgnoreCase)
                || string.Equals(roleKey, ConsultantRoleKey, StringComparison.OrdinalIgnoreCase)
                || string.Equals(roleKey, AuditeurRoleKey, StringComparison.OrdinalIgnoreCase);
        }

        public static string ToPrimaryRoleKey(string? roleName, int? societeId)
        {
            var canonicalRole = ResolveCanonicalRoleName(roleName, societeId);

            if (string.Equals(canonicalRole, SuperAdmin, StringComparison.OrdinalIgnoreCase)) return SuperAdminRoleKey;
            if (string.Equals(canonicalRole, AdminSociete, StringComparison.OrdinalIgnoreCase)) return AdminSocieteRoleKey;
            if (string.Equals(canonicalRole, Rssi, StringComparison.OrdinalIgnoreCase)) return RssiRoleKey;
            if (string.Equals(canonicalRole, Auditeur, StringComparison.OrdinalIgnoreCase)) return AuditeurRoleKey;
            return ConsultantRoleKey;
        }

        public static string ResolvePrimaryRole(IEnumerable<string>? roles, int? societeId)
        {
            var mapped = (roles ?? Array.Empty<string>())
                .Select(r => ResolveCanonicalRoleName(r, societeId))
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (mapped.Contains(SuperAdmin, StringComparer.OrdinalIgnoreCase)) return SuperAdmin;
            if (mapped.Contains(AdminSociete, StringComparer.OrdinalIgnoreCase)) return AdminSociete;
            if (mapped.Contains(Rssi, StringComparer.OrdinalIgnoreCase)) return Rssi;
            if (mapped.Contains(Auditeur, StringComparer.OrdinalIgnoreCase)) return Auditeur;
            if (mapped.Contains(Consultant, StringComparer.OrdinalIgnoreCase)) return Consultant;

            return Consultant;
        }

        public static string ResolveCanonicalRoleName(string? roleName, int? societeId)
        {
            if (TryParseTenantCustomRoleName(roleName, out _, out _))
            {
                // Custom tenant roles inherit consultant baseline constraints by default.
                return Consultant;
            }

            var key = NormalizeKey(roleName);

            if (string.IsNullOrWhiteSpace(key))
            {
                return Consultant;
            }

            if (string.Equals(key, SuperAdminKey, StringComparison.OrdinalIgnoreCase)) return SuperAdmin;
            if (string.Equals(key, AdminSocieteKey, StringComparison.OrdinalIgnoreCase)) return AdminSociete;
            if (string.Equals(key, AuditeurKey, StringComparison.OrdinalIgnoreCase)) return Auditeur;
            if (string.Equals(key, ConsultantKey, StringComparison.OrdinalIgnoreCase)) return Consultant;
            if (string.Equals(key, RssiKey, StringComparison.OrdinalIgnoreCase)) return Rssi;

            if (key.Contains("AUDITEUR", StringComparison.OrdinalIgnoreCase))
            {
                return Auditeur;
            }

            if (key.Contains("RSSI", StringComparison.OrdinalIgnoreCase)
                || key.Contains("SECURITE", StringComparison.OrdinalIgnoreCase))
            {
                return Rssi;
            }

            return Consultant;
        }

        public static string ToDisplayRoleName(string? roleName)
        {
            if (TryParseTenantCustomRoleName(roleName, out _, out var displayName))
            {
                return displayName;
            }

            return string.IsNullOrWhiteSpace(roleName)
                ? string.Empty
                : roleName.Trim();
        }

        public static bool IsTenantCustomRoleName(string? roleName)
            => TryParseTenantCustomRoleName(roleName, out _, out _);

        public static bool IsTenantCustomRoleOwnedBy(string? roleName, int societeId)
        {
            if (!TryParseTenantCustomRoleName(roleName, out var parsedSocieteId, out _))
            {
                return false;
            }

            return parsedSocieteId == societeId;
        }

        public static string BuildTenantCustomRoleName(int societeId, string displayRoleName)
        {
            if (societeId <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(societeId));
            }

            if (string.IsNullOrWhiteSpace(displayRoleName))
            {
                throw new ArgumentException("Display role name is required.", nameof(displayRoleName));
            }

            var normalizedDisplay = displayRoleName.Trim();
            return $"{TenantRolePrefix}S{societeId}::{normalizedDisplay}";
        }

        public static bool TryParseTenantCustomRoleName(string? roleName, out int societeId, out string displayRoleName)
        {
            societeId = 0;
            displayRoleName = string.Empty;

            if (string.IsNullOrWhiteSpace(roleName))
            {
                return false;
            }

            var raw = roleName.Trim();
            if (!raw.StartsWith(TenantRolePrefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var payload = raw[TenantRolePrefix.Length..];
            var separatorIndex = payload.IndexOf("::", StringComparison.Ordinal);
            if (separatorIndex <= 1)
            {
                return false;
            }

            var societeToken = payload[..separatorIndex];
            if (!societeToken.StartsWith("S", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!int.TryParse(societeToken[1..], out societeId) || societeId <= 0)
            {
                return false;
            }

            displayRoleName = payload[(separatorIndex + 2)..].Trim();
            if (string.IsNullOrWhiteSpace(displayRoleName))
            {
                return false;
            }

            return true;
        }

        public static string NormalizeKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = value.Trim().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark)
                {
                    continue;
                }

                if (!char.IsWhiteSpace(ch) && ch != '-' && ch != '_' && ch != '\'')
                {
                    sb.Append(char.ToUpperInvariant(ch));
                }
            }

            return sb.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
