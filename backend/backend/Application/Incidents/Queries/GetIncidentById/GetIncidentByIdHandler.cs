using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Incidents.Queries.GetIncidentById
{
    public class GetIncidentByIdHandler : IRequestHandler<GetIncidentByIdQuery, IncidentDto?>
    {
        private readonly AppDbContext _context;

        public GetIncidentByIdHandler(AppDbContext context) => _context = context;

        public async Task<IncidentDto?> Handle(GetIncidentByIdQuery request, CancellationToken cancellationToken)
        {
            // ── Isolation stricte : filtre sur Id ET SocieteId ─────────────────
            var incident = await _context.Incidents
                .Where(i => i.Id == request.Id)
                .Where(i => request.SocieteId.HasValue
                    ? i.SocieteId == request.SocieteId.Value
                    : i.SocieteId == null)
                .SingleOrDefaultAsync(cancellationToken);

            if (incident == null) return null;

            return new IncidentDto
            {
                Id = incident.Id,
                Titre = incident.Titre ?? string.Empty,
                Description = incident.Description,
                Date = incident.Date,
                Priorite = incident.Priorite,
                Statut = incident.Statut,
                Resolution = incident.Resolution
            };
        }
    }
}