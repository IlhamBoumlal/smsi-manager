// Application/Sensibilisation/Queries/GetDashboard/GetSensibilisationDashboardQuery.cs
using MediatR;
using backend.Application.DTOs;

namespace backend.Application.Sensibilisation.Queries.GetDashboard;

public record GetSensibilisationDashboardQuery(int? SocieteId)
    : IRequest<DashboardSensibilisationDto>;