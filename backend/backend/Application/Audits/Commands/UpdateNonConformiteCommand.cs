using Application.DTOs;
using backend.Infrastructure.Data;
using backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Audits.Commands
{
    public class UpdateNonConformiteCommand
    {
        private readonly AppDbContext _db;
        public UpdateNonConformiteCommand(AppDbContext db) => _db = db;

        public async Task<NonConformiteDto?> ExecuteAsync(Guid id, UpdateNonConformiteDto dto, int? societeId)
        {
            var nc = await _db.NonConformites
                .Include(n => n.CorrectiveActions)
                .Where(n => societeId.HasValue ? n.SocieteId == societeId.Value || n.SocieteId == null : n.SocieteId == null)
                .FirstOrDefaultAsync(n => n.Id == id);

            if (nc is null) return null;

            nc.Title = dto.Title;
            nc.Description = dto.Description;
            nc.ControlId = dto.ControlId;
            nc.Actor = dto.Actor;
            nc.CorrectiveAction = dto.CorrectiveAction;
            nc.Responsible = dto.Responsible;
            nc.Deadline = string.IsNullOrWhiteSpace(dto.Deadline) ? null : DateTime.Parse(dto.Deadline);
            nc.Status = dto.Status;
            nc.AuditName = dto.AuditName;
            nc.AuditId = dto.AuditId;
            nc.UpdatedAt = DateTime.UtcNow;

            // Sync corrective actions
            _db.ActionsCorrectives.RemoveRange(nc.CorrectiveActions);
            nc.CorrectiveActions.Clear();
            foreach (var a in dto.CorrectiveActions)
                nc.CorrectiveActions.Add(new ActionCorrective
                {
                    Description = a.Description,
                    Responsible = a.Responsible,
                    Deadline = string.IsNullOrWhiteSpace(a.Deadline) ? null : DateTime.Parse(a.Deadline),
                    Status = a.Status,
                });

            await _db.SaveChangesAsync();
            return CreateNonConformiteCommand.MapToDto(nc);
        }
    }

}
