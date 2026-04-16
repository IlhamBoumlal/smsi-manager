using backend.Application.DTOs.Incident.backend.Application.Dtos;
using MediatR;

namespace backend.Application.Incidents.Queries.GetAllIncidents
{
    public record GetAllIncidentsQuery() : IRequest<IEnumerable<IncidentDto>>;
}
