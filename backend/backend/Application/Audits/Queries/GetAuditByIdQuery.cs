using Application.Audits.Commands;
using Application.DTOs;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Queries
{
    public class GetAuditByIdQuery
    {
        private readonly AppDbContext _db;
        public GetAuditByIdQuery(AppDbContext db) => _db = db;

        public async Task<AuditDto?> ExecuteAsync(Guid id, int? societeId)
        {
            var audit = await _db.Audits
                .Include(a => a.ControlStatuses)
                .Where(a => societeId.HasValue && a.SocieteId == societeId.Value)
                .FirstOrDefaultAsync(a => a.Id == id);

            return audit is null ? null : CreateAuditCommand.MapToDto(audit);
        }
    }
}
