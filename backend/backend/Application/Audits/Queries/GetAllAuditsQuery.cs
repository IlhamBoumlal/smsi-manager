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

        public async Task<List<AuditDto>> ExecuteAsync()
        {
            var audits = await _db.Audits
                .Include(a => a.ControlStatuses)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return audits.Select(a => CreateAuditCommand.MapToDto(a)).ToList();
        }
    }
}
