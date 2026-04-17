using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Incidents.Queries.GetAllIncidents
{
    public class GetAllIncidentsHandler : IRequestHandler<GetAllIncidentsQuery, IEnumerable<IncidentDto>>
    {
        private readonly AppDbContext _context;
        public GetAllIncidentsHandler(AppDbContext context) => _context = context;

        public async Task<IEnumerable<IncidentDto>> Handle(GetAllIncidentsQuery request, CancellationToken cancellationToken)
        {
            return await _context.Incidents
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
        }
    }
}
