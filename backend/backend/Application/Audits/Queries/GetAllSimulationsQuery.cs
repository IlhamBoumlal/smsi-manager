using Application.DTOs;
using backend.Application.Audits.Commands;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Queries
{
    public class GetAllSimulationsQuery
    {
        private readonly AppDbContext _db;
        public GetAllSimulationsQuery(AppDbContext db) => _db = db;

        public async Task<List<SimulationAuditDto>> ExecuteAsync(int? societeId)
        {
            var sims = await _db.SimulationAudits
                .Where(s => societeId.HasValue && s.SocieteId == societeId.Value)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return sims.Select(CreateSimulationCommand.MapToDto).ToList();
        }
    }
}
