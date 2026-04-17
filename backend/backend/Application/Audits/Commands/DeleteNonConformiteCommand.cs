using backend.Infrastructure.Data;

namespace backend.Application.Audits.Commands
{
    public class DeleteNonConformiteCommand
    {
        private readonly AppDbContext _db;
        public DeleteNonConformiteCommand(AppDbContext db) => _db = db;

        public async Task<bool> ExecuteAsync(Guid id)
        {
            var nc = await _db.NonConformites.FindAsync(id);
            if (nc is null) return false;
            _db.NonConformites.Remove(nc);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
