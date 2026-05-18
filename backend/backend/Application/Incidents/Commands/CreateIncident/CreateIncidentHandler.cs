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
                _logger.LogError(ex,
                    "Erreur notifications pour incident {IncidentId}", incident.Id);
            }

            return incident.Id;
        }

        // ── SignalR ──────────────────────────────────────────────────────────
        private async Task SendSignalRNotificationsAsync(Incident incident)
        {
            _logger.LogInformation(
                "=== SignalR pour incident {Id} (SocieteId={SocieteId}) ===",
                incident.Id, incident.SocieteId);

            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "RSSI");

            if (role == null)
            {
                _logger.LogWarning("Rôle RSSI introuvable — SignalR annulé");
                return;
            }

            // Si SocieteId est null (import email sans société résolue) → tous les RSSI
            IQueryable<ApplicationUser> query;

            if (incident.SocieteId.HasValue)
            {
                query = from user in _context.Users
                        join userRole in _context.UserRoles on user.Id equals userRole.UserId
                        where userRole.RoleId == role.Id
                           && user.SocieteId == incident.SocieteId
                        select user;
            }
            else
            {
                query = from user in _context.Users
                        join userRole in _context.UserRoles on user.Id equals userRole.UserId
                        where userRole.RoleId == role.Id
                        select user;
            }

            var targets = await query.ToListAsync();

            if (!targets.Any())
            {
                _logger.LogWarning(
                    "Aucun RSSI trouvé pour SocieteId={SocieteId}", incident.SocieteId);
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

                try
                {
                    // Canal 1 : par userId
                    if (!string.IsNullOrEmpty(user.Id))
                    {
                        await _hubContext.Clients
                            .User(user.Id)
                            .SendAsync("ReceiveNotification", notification);
                    }

                    // Canal 2 : par groupe email (fallback fiable)
                    var groupName = user.Email.ToLower()
                        .Replace("@", "_")
                        .Replace(".", "_");

                    await _hubContext.Clients
                        .Group(groupName)
                        .SendAsync("ReceiveNotification", notification);

                    _logger.LogInformation(
                        "✅ SignalR → {Email} (userId={Id}, groupe={Group})",
                        user.Email, user.Id, groupName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur SignalR pour {Email}", user.Email);
                }
            }
        }

        // ── Email ────────────────────────────────────────────────────────────
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

                _logger.LogInformation("✅ Email envoyé à {Target}", TARGET_EMAIL);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur email vers {Target}", TARGET_EMAIL);
            }
        }
    }
}