using Application.Audits.Commands;
using Application.DTOs;
using backend.Infrastructure.Data;
using backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public class UpdateAuditCommand
{
    private readonly AppDbContext _db;
    public UpdateAuditCommand(AppDbContext db) => _db = db;

    public async Task<AuditDto?> ExecuteAsync(Guid id, UpdateAuditDto dto, int? societeId)
    {
        var audit = await _db.Audits
            .Where(a => societeId.HasValue ? a.SocieteId == societeId.Value || a.SocieteId == null : a.SocieteId == null)
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
        // Recréer les statuts sans dépendre d'entités enfants déjà chargées/tracked.
        await _db.AuditControlStatuses
            .Where(s => s.AuditId == audit.Id)
            .ExecuteDeleteAsync();

        foreach (var kv in dto.ControlStatuses)
        {
            _db.AuditControlStatuses.Add(new AuditControlStatus
            {
                AuditId = audit.Id,
                ControlId = kv.Key,
                Statut = kv.Value,
                Comment = dto.ControlComments.TryGetValue(kv.Key, out var c) ? c : null,
            });
        }

        await _db.SaveChangesAsync();
        return CreateAuditCommand.MapToDto(audit, dto.Author, dto.Date);
    }
}
