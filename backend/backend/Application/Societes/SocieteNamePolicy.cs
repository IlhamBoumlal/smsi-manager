using System;

namespace backend.Application.Societes
{
    public static class SocieteNamePolicy
    {
        public const string ReservedDemoName = "Societe Demo RBAC";

        public static bool IsReserved(string? nom)
        {
            return string.Equals(
                nom?.Trim(),
                ReservedDemoName,
                StringComparison.OrdinalIgnoreCase);
        }
    }
}
