using backend.Infrastructure.Data;

public class DeleteAuditCommand
{
    private readonly AppDbContext _db;
    public DeleteAuditCommand(AppDbContext db) => _db = db;

    public async Task<bool> ExecuteAsync(Guid id)
    {
        var audit = await _db.Audits.FindAsync(id);
        if (audit is null) return false;
        _db.Audits.Remove(audit);
        await _db.SaveChangesAsync();
        return true;
    }
}