using Application.DTOs;
using backend.Application.Audits.Commands;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Queries
{
    public class GetNonConformiteByIdQuery
    {
        private readonly AppDbContext _db;
        public GetNonConformiteByIdQuery(AppDbContext db) => _db = db;

        public async Task<NonConformiteDto?> ExecuteAsync(Guid id, int? societeId)
        {
            var nc = await _db.NonConformites
                .Include(n => n.CorrectiveActions)
                .Where(n => societeId.HasValue && n.SocieteId == societeId.Value)
                .FirstOrDefaultAsync(n => n.Id == id);

            return nc is null ? null : CreateNonConformiteCommand.MapToDto(nc);
        }
    }
}
