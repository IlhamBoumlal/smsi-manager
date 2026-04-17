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

        public async Task<List<NonConformiteDto>> ExecuteAsync()
        {
            var ncs = await _db.NonConformites
                .Include(n => n.CorrectiveActions)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return ncs.Select(CreateNonConformiteCommand.MapToDto).ToList();
        }
    }
}
