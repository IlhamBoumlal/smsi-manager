using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class DeleteAuditCommand
{
    private readonly AppDbContext _db;
    public DeleteAuditCommand(AppDbContext db) => _db = db;

    public async Task<bool> ExecuteAsync(Guid id, int? societeId)
    {
        var audit = await _db.Audits
            .Where(a => societeId.HasValue ? a.SocieteId == societeId.Value || a.SocieteId == null : a.SocieteId == null)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (audit is null) return false;
        _db.Audits.Remove(audit);
        await _db.SaveChangesAsync();
        return true;
    }
}