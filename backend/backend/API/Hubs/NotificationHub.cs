using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace backend.API.Hubs
{
    [Authorize(Policy = "SmsiTenantScope")]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userEmail = GetUserEmail();

            if (!string.IsNullOrEmpty(userEmail))
            {
                var groupName = NormalizeEmailForGroup(userEmail);
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation(
                    "✅ Utilisateur {Email} connecté — groupe: {Group} — ConnectionId: {ConnectionId}",
                    userEmail, groupName, Context.ConnectionId);
            }
            else
            {
                _logger.LogWarning(
                    "⚠️ Connexion SignalR sans email valide — ConnectionId: {ConnectionId}",
                    Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userEmail = GetUserEmail();

            if (!string.IsNullOrEmpty(userEmail))
            {
                var groupName = NormalizeEmailForGroup(userEmail);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation(
                    "❌ Utilisateur {Email} déconnecté — groupe: {Group}",
                    userEmail, groupName);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ── Helpers ────────────────────────────────────────────────────────────

        private string? GetUserEmail()
        {
            // Essayer plusieurs claim types selon la configuration du JWT
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value
                        ?? Context.User?.FindFirst("email")?.Value
                        ?? Context.User?.FindFirst("sub")?.Value
                        ?? Context.User?.Identity?.Name;

            _logger.LogDebug("GetUserEmail: email extrait = '{Email}'", email ?? "null");
            return email;  // ← Ne plus utiliser de fallback hardcodé
        }

        private static string NormalizeEmailForGroup(string email)
        {
            // Convertit "user@example.com" → "user_example_com"
            return email.ToLower()
                        .Replace("@", "_")
                        .Replace(".", "_");
        }
    }
}
