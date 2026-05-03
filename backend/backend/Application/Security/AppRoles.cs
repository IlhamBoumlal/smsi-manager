using System.Globalization;
using System.Text;

namespace backend.Application.Security
{
    public static class AppRoles
    {
        public const string SuperAdmin = "Super Admin";
        public const string AdminSociete = "Admin Societe";
        public const string Auditeur = "Auditeur";
        public const string Consultant = "Consultant";
        public const string Rssi = "RSSI";

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

            return societeId.HasValue ? Consultant : SuperAdmin;
        }

        public static string ResolveCanonicalRoleName(string? roleName, int? societeId)
        {
            var key = NormalizeKey(roleName);

            if (string.IsNullOrWhiteSpace(key))
            {
                return societeId.HasValue ? Consultant : SuperAdmin;
            }

            if (string.Equals(key, SuperAdminKey, StringComparison.OrdinalIgnoreCase)) return SuperAdmin;
            if (string.Equals(key, AdminSocieteKey, StringComparison.OrdinalIgnoreCase)) return AdminSociete;
            if (string.Equals(key, AuditeurKey, StringComparison.OrdinalIgnoreCase)) return Auditeur;
            if (string.Equals(key, ConsultantKey, StringComparison.OrdinalIgnoreCase)) return Consultant;
            if (string.Equals(key, RssiKey, StringComparison.OrdinalIgnoreCase)) return Rssi;

            if (string.Equals(key, "ADMIN", StringComparison.OrdinalIgnoreCase))
            {
                return societeId.HasValue ? AdminSociete : SuperAdmin;
            }

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
