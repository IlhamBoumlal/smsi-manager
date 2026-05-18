using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace backend.API.Hubs
{
    // ✅ On accepte les utilisateurs authentifiés (JWT valide suffit)
    // La policy SmsiTenantScope est trop restrictive pour SignalR
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userEmail = GetUserEmail();

            _logger.LogInformation(
                "SignalR OnConnected — userId={UserId}, email={Email}, connectionId={ConnectionId}",
                userId ?? "null", userEmail ?? "null", Context.ConnectionId);

            // Rejoindre le groupe par email (canal fiable)
            if (!string.IsNullOrEmpty(userEmail))
            {
                var emailGroup = NormalizeEmailForGroup(userEmail);
                await Groups.AddToGroupAsync(Context.ConnectionId, emailGroup);
                _logger.LogInformation(
                    "✅ {Email} → groupe email '{Group}'", userEmail, emailGroup);
            }

            // Rejoindre aussi un groupe par userId (canal direct)
            if (!string.IsNullOrEmpty(userId))
            {
                var userIdGroup = $"user_{userId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, userIdGroup);
                _logger.LogInformation(
                    "✅ userId={UserId} → groupe userId '{Group}'", userId, userIdGroup);
            }

            if (string.IsNullOrEmpty(userEmail) && string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning(
                    "⚠️ Connexion SignalR sans email ni userId — ConnectionId: {ConnectionId}",
                    Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            var userEmail = GetUserEmail();

            if (!string.IsNullOrEmpty(userEmail))
            {
                var emailGroup = NormalizeEmailForGroup(userEmail);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, emailGroup);
            }

            if (!string.IsNullOrEmpty(userId))
            {
                var userIdGroup = $"user_{userId}";
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userIdGroup);
            }

            _logger.LogInformation(
                "SignalR OnDisconnected — email={Email}, userId={UserId}",
                userEmail ?? "null", userId ?? "null");

            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendNotificationToUser(string userEmail, object notification)
        {
            var groupName = NormalizeEmailForGroup(userEmail);
            await Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
            _logger.LogInformation("Notification → {Email} (groupe: {Group})", userEmail, groupName);
        }

        public async Task SendNotificationToAll(object notification)
        {
            await Clients.All.SendAsync("ReceiveNotification", notification);
            _logger.LogInformation("Notification broadcast → TOUS");
        }

        public async Task TestNotificationForUser(string email)
        {
            var testNotification = new
            {
                type = "Test",
                message = $"Test de notification pour {email}",
                titre = "Test SignalR",
                description = "Si vous voyez ce message, la notification fonctionne !",
                incidentId = Guid.NewGuid().ToString(),
                priorite = "HAUTE",
                date = DateTime.UtcNow
            };

            await SendNotificationToUser(email, testNotification);
            _logger.LogInformation("🧪 Test notification → {Email}", email);
        }

        // ── Helpers ────────────────────────────────────────────────────────

        private string? GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst("userId")?.Value;
        }

        private string? GetUserEmail()
        {
            return Context.User?.FindFirst(ClaimTypes.Email)?.Value
                ?? Context.User?.FindFirst("email")?.Value
                ?? Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.Identity?.Name;
        }

        private static string NormalizeEmailForGroup(string email)
        {
            return email.ToLower()
                        .Replace("@", "_")
                        .Replace(".", "_");
        }
    }
}