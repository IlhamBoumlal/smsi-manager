using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace backend.API.Hubs
{
    [Authorize(Policy = "SignalRNotificationUser")]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userEmail = GetUserEmail(Context.User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Connexion SignalR refusee: claim email manquant.");
                Context.Abort();
                return;
            }

            var groupName = BuildUserGroup(userEmail);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("Utilisateur {Email} connecte au groupe {GroupName}", userEmail, groupName);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userEmail = GetUserEmail(Context.User);
            if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var groupName = BuildUserGroup(userEmail);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation("Utilisateur {Email} retire du groupe {GroupName}", userEmail, groupName);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendNotificationToUser(string userEmail, object notification)
        {
            var groupName = BuildUserGroup(userEmail);
            await Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
            _logger.LogInformation("Notification envoyee a {Email} (groupe: {GroupName})", userEmail, groupName);
        }

        public async Task SendNotificationToAll(object notification)
        {
            await Clients.All.SendAsync("ReceiveNotification", notification);
            _logger.LogInformation("Notification envoyee a tous les utilisateurs connectes");
        }

        public async Task TestNotification()
        {
            var userEmail = GetUserEmail(Context.User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("TestNotification appelee sans email utilisateur.");
                return;
            }

            await Clients.Caller.SendAsync("ReceiveNotification", new
            {
                type = "Test",
                message = "Test de connexion SignalR reussi",
                titre = "Test SignalR",
                description = "Si vous voyez ce message, la notification fonctionne",
                incidentId = Guid.NewGuid(),
                priorite = "HAUTE",
                date = DateTime.UtcNow
            });
        }

        public async Task TestNotificationForUser(string email)
        {
            var testNotification = new
            {
                type = "Test",
                message = $"Test de notification pour {email}",
                titre = "Test SignalR",
                description = "Si vous voyez ce message, la notification fonctionne",
                incidentId = Guid.NewGuid().ToString(),
                priorite = "HAUTE",
                date = DateTime.UtcNow
            };

            await SendNotificationToUser(email, testNotification);
        }

        public static string BuildUserGroup(string email)
        {
            return email.Trim().ToLowerInvariant();
        }

        private static string? GetUserEmail(ClaimsPrincipal? user)
        {
            return user?.FindFirst(ClaimTypes.Email)?.Value
                   ?? user?.FindFirst("email")?.Value
                   ?? user?.Identity?.Name;
        }
    }
}
