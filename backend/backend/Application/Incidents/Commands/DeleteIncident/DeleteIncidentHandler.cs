using backend.Infrastructure.Data;
using MediatR;

namespace backend.Application.Incidents.Commands.DeleteIncident
{
    public class DeleteIncidentHandler : IRequestHandler<DeleteIncidentCommand, bool>
    {
        private readonly AppDbContext _context;
        public DeleteIncidentHandler(AppDbContext context) => _context = context;

        public async Task<bool> Handle(DeleteIncidentCommand request, CancellationToken cancellationToken)
        {
            var incident = await _context.Incidents.FindAsync(new object[] { request.Id }, cancellationToken);
            if (incident == null) return false;
            _context.Incidents.Remove(incident);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
