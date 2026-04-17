using backend.API.Hubs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace backend.Application.Incidents.Commands.CreateIncident
{
    public class CreateIncidentHandler : IRequestHandler<CreateIncidentCommand, Guid>
    {
        private readonly AppDbContext _context;
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public CreateIncidentHandler(
            AppDbContext context,
            IUserRepository userRepository,
            IEmailService emailService,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _userRepository = userRepository;
            _emailService = emailService;
            _hubContext = hubContext; 
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
                Declarant = request.Incident.Declarant,
                Statut = StatutIncident.EnCours,
                Resolution = null
            };

            _context.Incidents.Add(incident);
            await _context.SaveChangesAsync(cancellationToken);

            // Attendre les notifications (mais avec un timeout)
            await NotifyTraitants(incident).WaitAsync(TimeSpan.FromSeconds(5));

            return incident.Id;
        }

        private async Task NotifyTraitants(Incident incident)
        {
            try
            {
                Console.WriteLine($"=== DÉBUT NotifyTraitants pour incident {incident.Id} ===");

                var traitants = await _userRepository.GetUsersByRoleAsync("User");
                Console.WriteLine($"Nombre de traitants trouvés: {traitants.Count()}");

                foreach (var traitant in traitants)
                {
                    Console.WriteLine($"Traitement pour: {traitant.Email}");

                    // Notification par email
                    await _emailService.SendIncidentNotificationAsync(
                        traitant.Email,
                        traitant.NomComplet,
                        incident.Titre,
                        incident.Description
                    );
                    Console.WriteLine($" Email envoyé à {traitant.Email}");

                    // Notification temps réel via SignalR
                    var groupName = traitant.Email.Replace("@", "_").Replace(".", "_");
                    Console.WriteLine($"Groupe SignalR cible: {groupName}");

                    // Vérifier que _hubContext n'est pas null
                    if (_hubContext == null)
                    {
                        Console.WriteLine($" _hubContext est NULL !");
                        continue;
                    }

                    try
                    {
                        await _hubContext.Clients.Group(groupName).SendAsync(
                            "ReceiveNotification",
                            new
                            {
                                type = "NewIncident",
                                incidentId = incident.Id,
                                titre = incident.Titre,
                                description = incident.Description,
                                priorite = incident.Priorite?.ToString(),
                                date = incident.Date,
                                message = $"Nouvel incident : {incident.Titre}"
                            }
                        );
                        Console.WriteLine($"SignalR envoyé avec succès à {traitant.Email} (groupe: {groupName})");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($" Erreur envoi SignalR: {ex.Message}");
                        Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Erreur notifications: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

    }
}