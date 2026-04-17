using Application.DTOs;
using backend.Infrastructure.Data;
using backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Application.Audits.Commands;

// ═══════════════════════════════════════════════════════════════
// AUDIT COMMANDS
// ═══════════════════════════════════════════════════════════════

public class CreateAuditCommand
{
    private readonly AppDbContext _db;
    public CreateAuditCommand(AppDbContext db) => _db = db;

    public async Task<AuditDto> ExecuteAsync(CreateAuditDto dto)
    {
        var audit = new Audit
        {
            Title = dto.Title,
            Type = dto.Type,
            Status = dto.Status,
            StartDate = DateTime.Parse(dto.StartDate),
            EndDate = string.IsNullOrWhiteSpace(dto.EndDate) ? null : DateTime.Parse(dto.EndDate),
            Auditor = dto.Auditor,
            Org = dto.Org,
            Rssi = dto.Rssi,
            Approver = dto.Approver,
            Scope = dto.Scope,
            Objectives = dto.Objectives,
            Author = dto.Author,       // ← AJOUTER
            Date = dto.Date,
        };

        // Contrôle statuses (post-audit)
        foreach (var kv in dto.ControlStatuses)
        {
            audit.ControlStatuses.Add(new AuditControlStatus
            {
                ControlId = kv.Key,
                Statut = kv.Value,
                Comment = dto.ControlComments.TryGetValue(kv.Key, out var c) ? c : null,
            });
        }

        _db.Audits.Add(audit);
        await _db.SaveChangesAsync();
        return MapToDto(audit, dto.Author, dto.Date);
    }

    internal static AuditDto MapToDto(Audit a, string? author = null, string? date = null) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Type = a.Type,
        Status = a.Status,
        StartDate = a.StartDate.ToString("yyyy-MM-dd"),
        EndDate = a.EndDate?.ToString("yyyy-MM-dd"),
        Auditor = a.Auditor,
        Org = a.Org,
        Rssi = a.Rssi,
        Approver = a.Approver,
        Scope = a.Scope,
        Objectives = a.Objectives,
        CreatedAt = a.CreatedAt,
        Author = author,
        Date = date,
        ControlStatuses = a.ControlStatuses.ToDictionary(s => s.ControlId, s => s.Statut),
        ControlComments = a.ControlStatuses
                           .Where(s => s.Comment != null)
                           .ToDictionary(s => s.ControlId, s => s.Comment!),
    };
}
