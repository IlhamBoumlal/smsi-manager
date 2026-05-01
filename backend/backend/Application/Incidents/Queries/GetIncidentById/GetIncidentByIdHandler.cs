using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Infrastructure.Data;
using MediatR;

namespace backend.Application.Incidents.Queries.GetIncidentById
{
    public class GetIncidentByIdHandler : IRequestHandler<GetIncidentByIdQuery, IncidentDto?>
    {
        private readonly AppDbContext _context;
        public GetIncidentByIdHandler(AppDbContext context) => _context = context;

        public async Task<IncidentDto?> Handle(GetIncidentByIdQuery request, CancellationToken cancellationToken)
        {
            var incident = await _context.Incidents.FindAsync(new object[] { request.Id }, cancellationToken);
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
