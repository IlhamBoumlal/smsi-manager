using System.Text;

namespace backend.Application.Security
{
    public static class PermissionCatalog
    {
        public static class Actions
        {
            public const string Read = "read";
            public const string Create = "create";
            public const string Edit = "edit";
            public const string Delete = "delete";
            public const string Import = "import";
            public const string Export = "export";
            public const string Approve = "approve";
            public const string Administer = "administer";

            private static readonly Dictionary<string, string> CanonicalMap = new(StringComparer.OrdinalIgnoreCase)
            {
                ["l"] = Read,
                ["lecture"] = Read,
                ["read"] = Read,
                ["view"] = Read,

                ["c"] = Create,
                ["create"] = Create,
                ["creation"] = Create,
                ["write"] = Create,

                ["m"] = Edit,
                ["edit"] = Edit,
                ["update"] = Edit,
                ["modify"] = Edit,
                ["modification"] = Edit,

                ["s"] = Delete,
                ["delete"] = Delete,
                ["remove"] = Delete,
                ["suppression"] = Delete,

                ["i"] = Import,
                ["import"] = Import,

                ["e"] = Export,
                ["export"] = Export,

                ["a"] = Approve,
                ["approve"] = Approve,
                ["approval"] = Approve,
                ["approbation"] = Approve,

                ["adm"] = Administer,
                ["admin"] = Administer,
                ["administrer"] = Administer,
                ["administer"] = Administer,
                ["manage"] = Administer,
                ["gestion"] = Administer,
            };

            public static string Canonicalize(string? value)
            {
                var key = NormalizeKey(value);
                if (string.IsNullOrWhiteSpace(key))
                {
                    return string.Empty;
                }

                return CanonicalMap.TryGetValue(key, out var mapped) ? mapped : key;
            }

            public static string FromHttpMethod(string? httpMethod)
            {
                var method = (httpMethod ?? string.Empty).Trim().ToUpperInvariant();
                return method switch
                {
                    "GET" => Read,
                    "HEAD" => Read,
                    "OPTIONS" => Read,
                    "POST" => Create,
                    "PUT" => Edit,
                    "PATCH" => Edit,
                    "DELETE" => Delete,
                    _ => Read
                };
            }
        }

        private static readonly Dictionary<string, string> ModuleAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tableaubord"] = "dashboard",
            ["tableaudebord"] = "dashboard",
            ["dashboard"] = "dashboard",

            ["audit"] = "audit",
            ["audits"] = "audit",

            ["user"] = "users",
            ["users"] = "users",
            ["utilisateurs"] = "users",

            ["role"] = "roles",
            ["roles"] = "roles",

            ["tracabilite"] = "tracabilite",
            ["traceabilite"] = "tracabilite",
            ["historique"] = "tracabilite",
            ["logs"] = "tracabilite",

            ["societe"] = "societes",
            ["societes"] = "societes",

            ["holding"] = "holdings",
            ["holdings"] = "holdings",

            ["statistiques"] = "statistiques",
            ["stats"] = "statistiques",
        };

        public static readonly HashSet<string> SmsiModules = new(StringComparer.OrdinalIgnoreCase)
        {
            "dashboard",
            "cartographie",
            "pdca",
            "clauses",
            "controles",
            "risques",
            "documentation",
            "actifs",
            "incidents",
            "sensibilisation",
            "audit",
            "chatbot",
            "tracabilite"
        };

        public static readonly HashSet<string> PlatformModules = new(StringComparer.OrdinalIgnoreCase)
        {
            "holdings",
            "societes",
            "statistiques"
        };

        public static string CanonicalizeModule(string? moduleCode)
        {
            var key = NormalizeKey(moduleCode);
            if (string.IsNullOrWhiteSpace(key))
            {
                return string.Empty;
            }

            return ModuleAliases.TryGetValue(key, out var mapped) ? mapped : key;
        }

        public static bool IsSmsiModule(string? moduleCode)
            => SmsiModules.Contains(CanonicalizeModule(moduleCode));

        public static bool IsPlatformModule(string? moduleCode)
            => PlatformModules.Contains(CanonicalizeModule(moduleCode));

        public static string NormalizeKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var normalized = value.Trim().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (char.IsWhiteSpace(ch) || ch == '-' || ch == '_' || ch == '\'' || ch == '.')
                {
                    continue;
                }

                var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
                if (category == System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    continue;
                }

                sb.Append(char.ToLowerInvariant(ch));
            }

            return sb.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
