using MediatR;

namespace backend.Application.Incidents.Commands.DeleteIncident
{
    public record DeleteIncidentCommand(Guid Id, int? SocieteId) : IRequest<bool>;
}
