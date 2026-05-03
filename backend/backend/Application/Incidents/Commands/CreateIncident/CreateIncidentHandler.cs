using backend.API.Hubs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
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
            _logger.LogInformation(
                "CreateIncidentHandler.Handle: SocieteId={SocieteId}, Titre={Titre}",
                request.SocieteId,
                request.Incident.Titre);

            if (!request.SocieteId.HasValue || request.SocieteId.Value <= 0)
                throw new InvalidOperationException("SocieteId obligatoire pour creer un incident.");

            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                Titre = request.Incident.Titre,
                Description = request.Incident.Description,
                Date = DateTime.UtcNow,
                Priorite = request.Incident.Priorite,
                Statut = StatutIncident.EnCours,
                Resolution = null,
                SocieteId = request.SocieteId.Value
            };

            await _context.Incidents.AddAsync(incident, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Incident créé: Id={IncidentId}, SocieteId={SocieteId}",
                incident.Id,
                incident.SocieteId);

            // ── Notifications fire-and-forget ──────────────────────────────────
            _ = Task.Run(async () =>
            {
                try
                {
                    await SendNotificationsAsync(incident);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de l'envoi des notifications pour incident {IncidentId}", incident.Id);
                }
            });

            return incident.Id;
        }

        // ── Notifications isolées par société ──────────────────────────────────
        private async Task SendNotificationsAsync(Incident incident)
        {
            _logger.LogInformation("=== ENVOI NOTIFICATIONS pour incident {IncidentId} (SocieteId={SocieteId}) ===",
                incident.Id, incident.SocieteId);

            IEnumerable<ApplicationUser> targets;

            try
            {
                targets = await _context.Users
                    .Where(u => u.SocieteId == incident.SocieteId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des utilisateurs cibles");
                return;
            }

            if (!targets.Any())
            {
                _logger.LogWarning("Aucun utilisateur trouvé pour SocieteId={SocieteId}", incident.SocieteId);
                return;
            }

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

            foreach (var user in targets)
            {
                if (string.IsNullOrEmpty(user.Email)) continue;

                var groupName = user.Email.ToLower()
                    .Replace("@", "_")
                    .Replace(".", "_");

                // SignalR
                try
                {
                    await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
                    _logger.LogInformation("✅ SignalR envoyé à {Email} (groupe: {Group})", user.Email, groupName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur SignalR pour {Email}", user.Email);
                }

                // Email
                try
                {
                    await _emailService.SendIncidentNotificationAsync(
                        user.Email,
                        user.UserName ?? user.Email,
                        incident.Titre ?? string.Empty,
                        incident.Description ?? string.Empty
                    );
                    _logger.LogInformation("✅ Email envoyé à {Email}", user.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur email pour {Email}", user.Email);
                }
            }
        }
    }
}
