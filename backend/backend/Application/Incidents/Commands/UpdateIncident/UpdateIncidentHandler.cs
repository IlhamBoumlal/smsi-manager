using backend.Infrastructure.Data;
using MediatR;

namespace backend.Application.Incidents.Commands.UpdateIncident
{
    public class UpdateIncidentHandler : IRequestHandler<UpdateIncidentCommand, bool>
    {
        private readonly AppDbContext _context;
        public UpdateIncidentHandler(AppDbContext context) => _context = context;

        // backend.Application/Incidents/Commands/UpdateIncident/UpdateIncidentHandler.cs
        public async Task<bool> Handle(UpdateIncidentCommand request, CancellationToken cancellationToken)
        {
            var incident = await _context.Incidents.FindAsync(new object[] { request.Id }, cancellationToken);
            if (incident == null) return false;

            incident.Titre = request.Incident.Titre;
            incident.Description = request.Incident.Description;
            incident.Priorite = request.Incident.Priorite;
            incident.Statut = request.Incident.Statut;      
            incident.Resolution = request.Incident.Resolution;  

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
