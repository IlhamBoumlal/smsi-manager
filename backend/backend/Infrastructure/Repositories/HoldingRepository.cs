using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class HoldingRepository : IHoldingRepository
    {
        private readonly AppDbContext _db;

        public HoldingRepository(AppDbContext db) => _db = db;

        public Task<Holding?> GetByIdAsync(int id) => _db.Holdings.FindAsync(id).AsTask();
        public Task<List<Holding>> GetAllAsync() => _db.Holdings.ToListAsync();

        public Task AddAsync(Holding holding) { _db.Holdings.Add(holding); return Task.CompletedTask; }
        public Task UpdateAsync(Holding holding) { _db.Holdings.Update(holding); return Task.CompletedTask; }
        public Task DeleteAsync(Holding holding) { _db.Holdings.Remove(holding); return Task.CompletedTask; }
        public Task SaveChangesAsync() => _db.SaveChangesAsync();
    }
}
