using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace backend.API.Hubs
{
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
            var userEmail = GetUserEmail();

            if (!string.IsNullOrEmpty(userEmail))
            {
                var groupName = NormalizeEmailForGroup(userEmail);
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation($"✅ Utilisateur {userEmail} connecté et ajouté au groupe {groupName}");
            }
            else
            {
                _logger.LogWarning($"⚠️ Connexion sans email valide - ConnectionId: {Context.ConnectionId}");
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
                _logger.LogInformation($"❌ Utilisateur {userEmail} déconnecté du groupe {groupName}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Méthode pour envoyer une notification à un utilisateur spécifique
        public async Task SendNotificationToUser(string userEmail, object notification)
        {
            var groupName = NormalizeEmailForGroup(userEmail);
            await Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
            _logger.LogInformation($"📨 Notification envoyée à {userEmail} (groupe: {groupName})");
        }

        // Méthode pour envoyer à tous les utilisateurs connectés
        public async Task SendNotificationToAll(object notification)
        {
            await Clients.All.SendAsync("ReceiveNotification", notification);
            _logger.LogInformation($"📨 Notification envoyée à TOUS les utilisateurs");
        }

        // Méthode de test
        public async Task TestNotificationForUser(string email)
        {
            var testNotification = new
            {
                type = "Test",
                message = $"Test de notification pour {email}",
                titre = "Test SignalR",
                description = "Si vous voyez ce message, la notification fonctionne!",
                incidentId = Guid.NewGuid().ToString(),
                priorite = "HAUTE",
                date = DateTime.UtcNow
            };

            await SendNotificationToUser(email, testNotification);
        }

        private string GetUserEmail()
        {
            // Essayer plusieurs méthodes pour récupérer l'email
            var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value
                        ?? Context.User?.FindFirst("email")?.Value
                        ?? Context.User?.Identity?.Name;

            _logger.LogInformation($"Email récupéré: {email ?? "null"}");
            return email ?? "boumlalilham@gmail.com"; // Fallback par défaut
        }

        private string NormalizeEmailForGroup(string email)
        {
            // Nettoyer l'email pour créer un nom de groupe valide
            return email?.ToLower().Replace("@", "_").Replace(".", "_") ?? "default_user";
        }
    }
}
