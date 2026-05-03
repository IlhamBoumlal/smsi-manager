using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Incidents.Commands.UpdateIncident
{
    public class UpdateIncidentHandler : IRequestHandler<UpdateIncidentCommand, bool>
    {
        private readonly AppDbContext _context;

        public UpdateIncidentHandler(AppDbContext context) => _context = context;

        public async Task<bool> Handle(UpdateIncidentCommand request, CancellationToken cancellationToken)
        {
            if (!request.SocieteId.HasValue || request.SocieteId.Value <= 0)
                return false;

            var incident = await _context.Incidents
                .Where(i => i.Id == request.Id)
                .Where(i => i.SocieteId == request.SocieteId.Value)
                .SingleOrDefaultAsync(cancellationToken);

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
