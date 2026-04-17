using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace backend.API.Hubs
{
    [AllowAnonymous]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"=== NOUVELLE CONNEXION SIGNALR ===");
            _logger.LogInformation($"ConnectionId: {Context.ConnectionId}");

            // Essayer de récupérer l'email du token
            var userEmail = Context.User?.FindFirst(ClaimTypes.Email)?.Value
                            ?? Context.User?.Identity?.Name;

            if (string.IsNullOrEmpty(userEmail))
            {
                userEmail = "boumlalilham@gmail.com";
                _logger.LogWarning($"Aucun email trouvé, utilisation forcée: {userEmail}");
            }

            // Nettoyer l'email pour créer un nom de groupe valide
            var groupName = userEmail.Replace("@", "_").Replace(".", "_");
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation($" Ajouté au groupe: {groupName}");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userEmail = Context.User?.FindFirst(ClaimTypes.Email)?.Value
                            ?? Context.User?.Identity?.Name;

            if (string.IsNullOrEmpty(userEmail))
            {
                userEmail = "boumlalilham@gmail.com";
            }

            var groupName = userEmail.Replace("@", "_").Replace(".", "_");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation($"Retiré du groupe: {groupName}");

            await base.OnDisconnectedAsync(exception);
        }

        // Méthode de test
        public async Task TestNotification()
        {
            var userEmail = Context.User?.FindFirst(ClaimTypes.Email)?.Value
                            ?? Context.User?.Identity?.Name;

            if (string.IsNullOrEmpty(userEmail))
            {
                userEmail = "boumlalilham@gmail.com";
            }

            _logger.LogInformation($" TestNotification - Envoi à: {userEmail}");

            await Clients.Caller.SendAsync("ReceiveNotification", new
            {
                type = "Test",
                message = "Test de connexion SignalR réussi!",
                titre = "Test de notification",
                description = "Si vous voyez ce message, SignalR fonctionne",
                incidentId = Guid.NewGuid(),
                priorite = "HAUTE",
                date = DateTime.UtcNow
            });
        }
    }
}