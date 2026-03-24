using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class SocieteRepository :ISocieteRepository
    {
        private readonly AppDbContext _db;

        public SocieteRepository(AppDbContext db) => _db = db;

        public Task<Societe?> GetByIdAsync(int id) => _db.Societes.FindAsync(id).AsTask();

        public Task<List<Societe>> GetAllAsync(int? holdingId = null)
        {
            var query = _db.Societes.AsQueryable();
            if (holdingId.HasValue)
                query = query.Where(s => s.HoldingId == holdingId.Value);
            return query.ToListAsync();
        }

        public Task AddAsync(Societe societe) { _db.Societes.Add(societe); return Task.CompletedTask; }
        public Task UpdateAsync(Societe societe) { _db.Societes.Update(societe); return Task.CompletedTask; }
        public Task DeleteAsync(Societe societe) { _db.Societes.Remove(societe); return Task.CompletedTask; }
        public Task SaveChangesAsync() => _db.SaveChangesAsync();
    }
}
