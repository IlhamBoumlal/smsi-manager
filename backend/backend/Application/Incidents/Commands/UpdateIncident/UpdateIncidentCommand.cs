using backend.Application.DTOs.Incident.backend.Application.Dtos;
using MediatR;

namespace backend.Application.Incidents.Commands.UpdateIncident
{
    public record UpdateIncidentCommand(Guid Id, IncidentDto Incident, int? SocieteId) : IRequest<bool>;
}
