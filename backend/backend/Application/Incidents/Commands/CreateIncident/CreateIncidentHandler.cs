using backend.API.Hubs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Incidents.Commands.CreateIncident
{
    public class CreateIncidentHandler : IRequestHandler<CreateIncidentCommand, Guid>
    {
        private readonly AppDbContext _context;
        private readonly IUserRepository _userRepository;
        private readonly IEmailServiceIncident _emailService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<CreateIncidentHandler> _logger;

        public CreateIncidentHandler(
            AppDbContext context,
            IUserRepository userRepository,
            IEmailServiceIncident emailService,
            IHubContext<NotificationHub> hubContext,
            ILogger<CreateIncidentHandler> logger)
        {
            _context = context;
            _userRepository = userRepository;
            _emailService = emailService;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<Guid> Handle(CreateIncidentCommand request, CancellationToken cancellationToken)
        {
            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                Titre = request.Incident.Titre,
                Description = request.Incident.Description,
                Date = DateTime.UtcNow,
                Priorite = request.Incident.Priorite,
                Statut = StatutIncident.EnCours,
                Resolution = null
            };

            await _context.Incidents.AddAsync(incident, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Envoyer les notifications SANS attendre (fire and forget)
            _ = Task.Run(async () => {
                try
                {
                    await SendNotificationsDirectly(incident);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de l'envoi des notifications");
                }
            });

            return incident.Id;
        }

        private async Task SendNotificationsDirectly(Incident incident)
        {
            try
            {
                _logger.LogInformation($"=== ENVOI NOTIFICATIONS pour incident {incident.Id} ===");

                var targetEmail = "boumlalilham@gmail.com";
                var groupName = targetEmail.Replace("@", "_").Replace(".", "_");

                var notification = new
                {
                    type = "NewIncident",
                    incidentId = incident.Id,
                    titre = incident.Titre,
                    description = incident.Description,
                    priorite = incident.Priorite?.ToString() ?? "MOYENNE",
                    date = incident.Date,
                    message = $"🚨 NOUVEL INCIDENT : {incident.Titre}",
                    statut = "EnCours"
                };

                // ENVOYER UNIQUEMENT À L'UTILISATEUR SPÉCIFIQUE (pas de broadcast)
                try
                {
                    await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
                    _logger.LogInformation($"✅ Notification envoyée à {targetEmail}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur envoi notification");
                }

                // Email (optionnel, gardez-le ou supprimez-le selon vos besoins)
                try
                {
                    await _emailService.SendIncidentNotificationAsync(
                        targetEmail,
                        "Ilham Boumlal",
                        incident.Titre,
                        incident.Description
                    );
                    _logger.LogInformation($"✅ Email envoyé à {targetEmail}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur email");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur générale dans SendNotificationsDirectly");
            }
        }
    }
}