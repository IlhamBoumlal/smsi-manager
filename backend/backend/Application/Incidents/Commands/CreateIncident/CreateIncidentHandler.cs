using backend.API.Hubs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.SignalR;

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

            try
            {
                await NotifyTraitantsAsync(incident).WaitAsync(TimeSpan.FromSeconds(5), cancellationToken);
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("Timeout lors de l'envoi des notifications pour incident {IncidentId}", incident.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi des notifications pour incident {IncidentId}", incident.Id);
            }

            return incident.Id;
        }

        private async Task NotifyTraitantsAsync(Incident incident)
        {
            var traitants = await _userRepository.GetUsersByRoleAsync("User");
            if (traitants is null)
            {
                _logger.LogWarning("Aucun traitant trouve pour incident {IncidentId}", incident.Id);
                return;
            }

            var incidentTitle = incident.Titre ?? "Incident sans titre";
            var incidentDescription = incident.Description ?? string.Empty;

            var notification = new
            {
                type = "NewIncident",
                incidentId = incident.Id,
                titre = incidentTitle,
                description = incidentDescription,
                priorite = incident.Priorite?.ToString() ?? "MOYENNE",
                date = incident.Date,
                message = $"Nouvel incident : {incidentTitle}",
                statut = "EnCours"
            };

            foreach (var traitant in traitants)
            {
                if (string.IsNullOrWhiteSpace(traitant.Email))
                {
                    continue;
                }

                try
                {
                    await _emailService.SendIncidentNotificationAsync(
                        traitant.Email,
                        traitant.NomComplet,
                        incidentTitle,
                        incidentDescription);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur email incident {IncidentId} vers {Email}", incident.Id, traitant.Email);
                }

                try
                {
                    var groupName = NotificationHub.BuildUserGroup(traitant.Email);
                    await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur SignalR incident {IncidentId} vers {Email}", incident.Id, traitant.Email);
                }
            }
        }
    }
}
