// Infrastructure/Services/RappelHostedService.cs
// Lance toutes les heures et envoie les rappels aux formations J-2

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MediatR;
using backend.Application.Sensibilisation.Commands.NotifyParticipants;
using backend.Infrastructure.Repositories;
using backend.Domain.Enumerations;

namespace backend.Infrastructure.Services;

public class RappelHostedService(IServiceScopeFactory scopeFactory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);

            using var scope = scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IFormationRepository>();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

            var formations = await repo.GetAllAsync(null, stoppingToken);
            var in48h = formations
                .Where(f =>
                    f.Status == FormationStatus.Planifiee &&
                    f.NotifRappel &&
                    f.DateDebut.ToUniversalTime() - DateTime.UtcNow is { TotalHours: > 0 and <= 48 })
                .ToList();

            foreach (var f in in48h)
            {
                await mediator.Send(
                    new NotifyParticipantsCommand(f.Id, "Rappel 48h avant"),
                    stoppingToken);
            }
        }
    }
}

// Dans Program.cs :
// builder.Services.AddHostedService<RappelHostedService>();