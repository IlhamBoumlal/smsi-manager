using MediatR;

namespace backend.Application.Incidents.Commands.DeleteIncident
{
    public record DeleteIncidentCommand(Guid Id) : IRequest<bool>;
}
