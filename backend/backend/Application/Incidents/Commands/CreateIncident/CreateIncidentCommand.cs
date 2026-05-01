using backend.Application.DTOs.Incident.backend.Application.Dtos;
using MediatR;

namespace backend.Application.Incidents.Commands.CreateIncident
{
    public record CreateIncidentCommand(IncidentDto Incident, int? SocieteId) : IRequest<Guid>;
}
