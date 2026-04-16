// Application/Sensibilisation/Queries/GetDashboard/GetSensibilisationDashboardQueryHandler.cs
using MediatR;
using backend.Application.DTOs;
using backend.Domain.Enumerations;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Queries.GetDashboard;

public class GetSensibilisationDashboardQueryHandler(IFormationRepository repo)
    : IRequestHandler<GetSensibilisationDashboardQuery, DashboardSensibilisationDto>
{
    public async Task<DashboardSensibilisationDto> Handle(
        GetSensibilisationDashboardQuery request, CancellationToken ct)
    {
        var all = (await repo.GetAllAsync(request.SocieteId, ct)).ToList();

        var terminees = all.Where(f => f.Status == FormationStatus.Terminee).ToList();
        var taux = terminees.Count > 0
            ? terminees.Average(f =>
                f.Participants.Count > 0
                    ? (double)f.NbPresents / f.Participants.Count * 100
                    : 0)
            : 0;

        return new DashboardSensibilisationDto
        {
            Total = all.Count,
            Terminees = terminees.Count,
            Planifiees = all.Count(f => f.Status == FormationStatus.Planifiee),
            EnCours = all.Count(f => f.Status == FormationStatus.EnCours),
            TauxMoyen = Math.Round(taux, 1),
        };
    }
}