using backend.Application.DTOs.Incident.backend.Application.Dtos;
using MediatR;

namespace backend.Application.Incidents.Queries.GetIncidentById
{
    public record GetIncidentByIdQuery(Guid Id) : IRequest<IncidentDto?>;

}
