using backend.API.Hubs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace backend.Application.Incidents.Commands.CreateIncident
{
    public class CreateIncidentHandler : IRequestHandler<CreateIncidentCommand, Guid>
    {
        private readonly AppDbContext _context;
        private readonly IUserRepository _userRepository;
        private readonly IEmailServiceIncident _emailService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<CreateIncidentHandler> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // Adresse email cible pour les notifications email (fixe)
        private const string TARGET_EMAIL = "boumlalilham@gmail.com";

        public CreateIncidentHandler(
            AppDbContext context,
            IUserRepository userRepository,
            IEmailServiceIncident emailService,
            IHubContext<NotificationHub> hubContext,
            ILogger<CreateIncidentHandler> logger,
            IServiceScopeFactory scopeFactory,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _userRepository = userRepository;
            _emailService = emailService;
            _hubContext = hubContext;
            _logger = logger;
            _scopeFactory = scopeFactory;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<Guid> Handle(CreateIncidentCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "CreateIncidentHandler.Handle: SocieteId={SocieteId}, Titre={Titre}",
                request.SocieteId,
                request.Incident.Titre);

            if (request.SocieteId == null)
            {
                _logger.LogWarning("CreateIncidentHandler: SocieteId est NULL — l'incident ne sera pas isolé par société.");
            }

            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                Titre = request.Incident.Titre,
                Description = request.Incident.Description,
                Date = DateTime.UtcNow,
                Priorite = request.Incident.Priorite,
                Statut = StatutIncident.EnCours,
                Resolution = null,
                SocieteId = request.SocieteId
            };

            await _context.Incidents.AddAsync(incident, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Incident créé: Id={IncidentId}, SocieteId={SocieteId}",
                incident.Id,
                incident.SocieteId);

            // ── Notifications fire-and-forget dans un scope dédié ──────────────────
            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailServiceIncident>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<CreateIncidentHandler>>();

                try
                {
                    // Envoi des notifications SignalR aux utilisateurs ayant le rôle RSSI
                    await SendSignalRNotificationsAsync(incident, dbContext, hubContext, logger);
                    // Envoi de l'email à l'adresse fixe
                    await SendEmailNotificationAsync(incident, emailService, logger);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Erreur lors de l'envoi des notifications pour incident {IncidentId}", incident.Id);
                }
            });

            return incident.Id;
        }

        // ── Envoi des notifications SignalR aux utilisateurs avec le rôle "RSSI" ──────────
        private async Task SendSignalRNotificationsAsync(
            Incident incident,
            AppDbContext dbContext,
            IHubContext<NotificationHub> hubContext,
            ILogger<CreateIncidentHandler> logger)
        {
            logger.LogInformation("=== ENVOI SIGNALR pour incident {IncidentId} (SocieteId={SocieteId}) ===",
                incident.Id, incident.SocieteId);

            // Récupérer les utilisateurs ayant le rôle "RSSI" (ou "Admin" si "RSSI" n'existe pas)
            var rssiRoleName = "RSSI";
            var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == rssiRoleName);
            if (role == null)
            {
                logger.LogWarning("Le rôle {RoleName} n'existe pas. Aucune notification SignalR envoyée.", rssiRoleName);
                return;
            }

            // Requête : utilisateurs de la société concernée + ayant le rôle RSSI
            var query = from user in dbContext.Users
                        join userRole in dbContext.UserRoles on user.Id equals userRole.UserId
                        where userRole.RoleId == role.Id
                        && (incident.SocieteId == null ? user.SocieteId == null : user.SocieteId == incident.SocieteId)
                        select user;

            var targets = await query.ToListAsync();

            if (!targets.Any())
            {
                logger.LogWarning("Aucun utilisateur avec le rôle {RoleName} trouvé pour SocieteId={SocieteId}",
                    rssiRoleName, incident.SocieteId);
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

                try
                {
                    await hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
                    logger.LogInformation("✅ SignalR envoyé à {Email} (groupe: {Group})", user.Email, groupName);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ Erreur SignalR pour {Email}", user.Email);
                }
            }
        }

        // ── Envoi d'un email à l'adresse fixe ─────────────────────────────────────────
        private async Task SendEmailNotificationAsync(
            Incident incident,
            IEmailServiceIncident emailService,
            ILogger<CreateIncidentHandler> logger)
        {
            logger.LogInformation("=== ENVOI EMAIL pour incident {IncidentId} à {TargetEmail} ===",
                incident.Id, TARGET_EMAIL);

            try
            {
                await emailService.SendIncidentNotificationAsync(
                    TARGET_EMAIL,
                    "RSSI",  // Nom du destinataire (peut être personnalisé)
                    incident.Titre ?? string.Empty,
                    incident.Description ?? string.Empty
                );
                logger.LogInformation("✅ Email envoyé à {TargetEmail}", TARGET_EMAIL);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Erreur lors de l'envoi de l'email à {TargetEmail}", TARGET_EMAIL);
            }
        }
    }
}