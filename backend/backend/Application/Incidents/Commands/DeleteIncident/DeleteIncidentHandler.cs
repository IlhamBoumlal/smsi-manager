using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Incidents.Commands.DeleteIncident
{
    public class DeleteIncidentHandler : IRequestHandler<DeleteIncidentCommand, bool>
    {
        private readonly AppDbContext _context;

        public DeleteIncidentHandler(AppDbContext context) => _context = context;

        public async Task<bool> Handle(DeleteIncidentCommand request, CancellationToken cancellationToken)
        {
            // ── Isolation stricte : filtre sur Id ET SocieteId ─────────────────
            // Une société ne peut supprimer que ses propres incidents
            var incident = await _context.Incidents
                .Where(i => i.Id == request.Id)
                .Where(i => request.SocieteId.HasValue
                    ? i.SocieteId == request.SocieteId.Value
                    : i.SocieteId == null)
                .SingleOrDefaultAsync(cancellationToken);

            if (incident == null) return false;

            _context.Incidents.Remove(incident);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}