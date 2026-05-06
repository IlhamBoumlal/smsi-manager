using Application.Audits.Commands;
using Application.DTOs;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Queries
{
    public class GetAllAuditsQuery
    {
        private readonly AppDbContext _db;
        public GetAllAuditsQuery(AppDbContext db) => _db = db;

        public async Task<List<AuditDto>> ExecuteAsync(int? societeId)
        {
            var audits = await _db.Audits
                .Include(a => a.ControlStatuses)
                .Where(a => societeId.HasValue ? a.SocieteId == societeId.Value || a.SocieteId == null : a.SocieteId == null)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return audits.Select(a => CreateAuditCommand.MapToDto(a)).ToList();
        }
    }
}
