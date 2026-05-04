using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Commands
{
    public class DeleteSimulationCommand
    {
        private readonly AppDbContext _db;
        public DeleteSimulationCommand(AppDbContext db) => _db = db;

        public async Task<bool> ExecuteAsync(Guid id, int? societeId)
        {
            var sim = await _db.SimulationAudits
                .Where(s => societeId.HasValue && s.SocieteId == societeId.Value)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (sim is null) return false;
            _db.SimulationAudits.Remove(sim);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
