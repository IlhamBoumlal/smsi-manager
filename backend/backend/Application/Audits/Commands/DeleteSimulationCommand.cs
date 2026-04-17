using backend.Infrastructure.Data;

namespace backend.Application.Audits.Commands
{
    public class DeleteSimulationCommand
    {
        private readonly AppDbContext _db;
        public DeleteSimulationCommand(AppDbContext db) => _db = db;

        public async Task<bool> ExecuteAsync(Guid id)
        {
            var sim = await _db.SimulationAudits.FindAsync(id);
            if (sim is null) return false;
            _db.SimulationAudits.Remove(sim);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
