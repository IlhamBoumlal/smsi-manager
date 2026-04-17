using Application.Audits.Commands;
using Application.DTOs;
using backend.Infrastructure.Data;
using backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public class UpdateAuditCommand
{
    private readonly AppDbContext _db;
    public UpdateAuditCommand(AppDbContext db) => _db = db;

    public async Task<AuditDto?> ExecuteAsync(Guid id, UpdateAuditDto dto)
    {
        var audit = await _db.Audits
            .Include(a => a.ControlStatuses)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (audit is null) return null;

        audit.Title = dto.Title;
        audit.Type = dto.Type;
        audit.Status = dto.Status;
        audit.StartDate = DateTime.Parse(dto.StartDate);
        audit.EndDate = string.IsNullOrWhiteSpace(dto.EndDate) ? null : DateTime.Parse(dto.EndDate);
        audit.Auditor = dto.Auditor;
        audit.Org = dto.Org;
        audit.Rssi = dto.Rssi;
        audit.Approver = dto.Approver;
        audit.Scope = dto.Scope;
        audit.Objectives = dto.Objectives;
        audit.UpdatedAt = DateTime.UtcNow;
        audit.Author = dto.Author;    // ← AJOUTER
        audit.Date = dto.Date;
        // Recréer les contrôle statuses
        _db.AuditControlStatuses.RemoveRange(audit.ControlStatuses);
        audit.ControlStatuses.Clear();
        foreach (var kv in dto.ControlStatuses)
        {
            audit.ControlStatuses.Add(new AuditControlStatus
            {
                ControlId = kv.Key,
                Statut = kv.Value,
                Comment = dto.ControlComments.TryGetValue(kv.Key, out var c) ? c : null,
            });
        }

        await _db.SaveChangesAsync();
        return CreateAuditCommand.MapToDto(audit, dto.Author, dto.Date);
    }
}