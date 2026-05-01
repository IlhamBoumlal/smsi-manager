using backend.Application.DTOs.Dashboard;
using MediatR;

namespace backend.Application.Dashboard.Queries.GetGlobalDashboard
{
    public record GetGlobalDashboardQuery(int? CurrentSocieteId) : IRequest<GlobalDashboardDto>;
}
