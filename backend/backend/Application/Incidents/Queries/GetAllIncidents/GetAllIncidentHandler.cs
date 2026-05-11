using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Application.Incidents.Queries.GetAllIncidents
{
    public class GetAllIncidentsHandler : IRequestHandler<GetAllIncidentsQuery, IEnumerable<IncidentDto>>
    {
        private readonly AppDbContext _context;
        private readonly ILogger<GetAllIncidentsHandler> _logger;

        public GetAllIncidentsHandler(AppDbContext context, ILogger<GetAllIncidentsHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<IncidentDto>> Handle(GetAllIncidentsQuery request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("GetAllIncidentsHandler: SocieteId={SocieteId}", request.SocieteId);

            // ── Isolation stricte par société ──────────────────────────────────
            // Si SocieteId est fourni → incidents de cette société uniquement
            // Si SocieteId est null   → incidents sans société (super-admin)
            var query = _context.Incidents.AsQueryable();

            query = request.SocieteId.HasValue
                ? query.Where(i => i.SocieteId == request.SocieteId.Value)
                : query.Where(i => i.SocieteId == null);

            var incidents = await query
                .OrderByDescending(i => i.Date)
                .Select(i => new IncidentDto
                {
                    Id = i.Id,
                    Titre = i.Titre,
                    Description = i.Description,
                    Date = i.Date,
                    Priorite = i.Priorite,
                    Statut = i.Statut,
                    Resolution = i.Resolution
                })
                .ToListAsync(cancellationToken);

            _logger.LogInformation("GetAllIncidentsHandler: {Count} incidents trouvés pour SocieteId={SocieteId}",
                incidents.Count, request.SocieteId);

            return incidents;
        }
    }
}