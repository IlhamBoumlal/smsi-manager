using Application.DTOs;
using backend.Application.Audits.Commands;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Queries
{
    public class GetAllNonConformitesQuery
    {
        private readonly AppDbContext _db;
        public GetAllNonConformitesQuery(AppDbContext db) => _db = db;

        public async Task<List<NonConformiteDto>> ExecuteAsync(int? societeId)
        {
            var ncs = await _db.NonConformites
                .Include(n => n.CorrectiveActions)
                .Where(n => societeId.HasValue ? n.SocieteId == societeId.Value || n.SocieteId == null : n.SocieteId == null)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return ncs.Select(CreateNonConformiteCommand.MapToDto).ToList();
        }
    }
}
