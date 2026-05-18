using backend.API.Hubs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
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
        private readonly IHttpContextAccessor _httpContextAccessor;

        private const string TARGET_EMAIL = "boumlalilham@gmail.com";

        public CreateIncidentHandler(
            AppDbContext context,
            IUserRepository userRepository,
            IEmailServiceIncident emailService,
            IHubContext<NotificationHub> hubContext,
            ILogger<CreateIncidentHandler> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _userRepository = userRepository;
            _emailService = emailService;
            _hubContext = hubContext;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<Guid> Handle(CreateIncidentCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "CreateIncidentHandler — SocieteId={SocieteId}, Titre={Titre}",
                request.SocieteId, request.Incident.Titre);

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
                "Incident créé — Id={Id}, SocieteId={SocieteId}",
                incident.Id, incident.SocieteId);

            try
            {
                await SendSignalRNotificationsAsync(incident);
                await SendEmailNotificationAsync(incident);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur notifications pour incident {Id}", incident.Id);
            }

            return incident.Id;
        }

        private async Task SendSignalRNotificationsAsync(Incident incident)
        {
            _logger.LogInformation(
                "=== SignalR pour incident {Id} (SocieteId={SocieteId}) ===",
                incident.Id, incident.SocieteId);

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "RSSI");
            if (role == null)
            {
                _logger.LogWarning("Rôle RSSI introuvable — SignalR annulé");
                return;
            }

            IQueryable<ApplicationUser> query;

            if (incident.SocieteId.HasValue)
            {
                query = from user in _context.Users
                        join ur in _context.UserRoles on user.Id equals ur.UserId
                        where ur.RoleId == role.Id
                           && user.SocieteId == incident.SocieteId
                        select user;
            }
            else
            {
                // Pas de société connue → tous les RSSI
                query = from user in _context.Users
                        join ur in _context.UserRoles on user.Id equals ur.UserId
                        where ur.RoleId == role.Id
                        select user;
            }

            var targets = await query.Distinct().ToListAsync();

            if (!targets.Any())
            {
                _logger.LogWarning("Aucun RSSI pour SocieteId={SocieteId}", incident.SocieteId);
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
                if (string.IsNullOrEmpty(user.Email) && string.IsNullOrEmpty(user.Id))
                    continue;

                try
                {
                    // Canal 1 : groupe userId (nouveau, via OnConnectedAsync)
                    if (!string.IsNullOrEmpty(user.Id))
                    {
                        await _hubContext.Clients
                            .Group($"user_{user.Id}")
                            .SendAsync("ReceiveNotification", notification);
                    }

                    // Canal 2 : groupe email (toujours fonctionnel)
                    if (!string.IsNullOrEmpty(user.Email))
                    {
                        var emailGroup = user.Email.ToLower()
                            .Replace("@", "_")
                            .Replace(".", "_");

                        await _hubContext.Clients
                            .Group(emailGroup)
                            .SendAsync("ReceiveNotification", notification);
                    }

                    // Canal 3 : par userId SignalR natif (si IUserIdProvider configuré)
                    if (!string.IsNullOrEmpty(user.Id))
                    {
                        await _hubContext.Clients
                            .User(user.Id)
                            .SendAsync("ReceiveNotification", notification);
                    }

                    _logger.LogInformation(
                        "✅ SignalR → {Email} (userId={Id})", user.Email, user.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ SignalR échoué pour {Email}", user.Email);
                }
            }
        }

        private async Task SendEmailNotificationAsync(Incident incident)
        {
            _logger.LogInformation(
                "=== Email pour incident {Id} → {Target} ===",
                incident.Id, TARGET_EMAIL);

            try
            {
                await _emailService.SendIncidentNotificationAsync(
                    TARGET_EMAIL,
                    "RSSI",
                    incident.Titre ?? string.Empty,
                    incident.Description ?? string.Empty);

                _logger.LogInformation("✅ Email → {Target}", TARGET_EMAIL);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Email échoué → {Target}", TARGET_EMAIL);
            }
        }
    }
}