using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Commands
{
    public class DeleteNonConformiteCommand
    {
        private readonly AppDbContext _db;
        public DeleteNonConformiteCommand(AppDbContext db) => _db = db;

        public async Task<bool> ExecuteAsync(Guid id, int? societeId)
        {
            var nc = await _db.NonConformites
                .Where(n => societeId.HasValue ? n.SocieteId == societeId.Value || n.SocieteId == null : n.SocieteId == null)
                .FirstOrDefaultAsync(n => n.Id == id);
            if (nc is null) return false;
            _db.NonConformites.Remove(nc);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
