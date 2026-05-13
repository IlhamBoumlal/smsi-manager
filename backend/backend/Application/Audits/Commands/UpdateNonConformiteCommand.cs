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
                .Where(n => societeId.HasValue && n.SocieteId == societeId.Value)
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

            // Sync corrective actions while preserving existing tracked entities.
            var originalActionsById = nc.CorrectiveActions.ToDictionary(a => a.Id, a => a);
            var incomingIds = new HashSet<Guid>();

            foreach (var actionDto in dto.CorrectiveActions)
            {
                if (!string.IsNullOrWhiteSpace(actionDto.Id) && Guid.TryParse(actionDto.Id, out var parsedId) && originalActionsById.TryGetValue(parsedId, out var existingAction))
                {
                    incomingIds.Add(parsedId);
                    existingAction.Description = actionDto.Description;
                    existingAction.Responsible = actionDto.Responsible;
                    existingAction.Deadline = string.IsNullOrWhiteSpace(actionDto.Deadline) ? null : DateTime.Parse(actionDto.Deadline);
                    existingAction.Status = actionDto.Status;
                    _db.Entry(existingAction).State = EntityState.Modified;
                }
                else
                {
                    var addedAction = new ActionCorrective
                    {
                        Description = actionDto.Description,
                        Responsible = actionDto.Responsible,
                        Deadline = string.IsNullOrWhiteSpace(actionDto.Deadline) ? null : DateTime.Parse(actionDto.Deadline),
                        Status = actionDto.Status,
                    };
                    nc.CorrectiveActions.Add(addedAction);
                    _db.Entry(addedAction).State = EntityState.Added;
                }
            }

            var actionsToRemove = originalActionsById.Values.Where(a => !incomingIds.Contains(a.Id)).ToList();
            if (actionsToRemove.Any())
            {
                foreach (var action in actionsToRemove)
                {
                    nc.CorrectiveActions.Remove(action);
                    _db.Entry(action).State = EntityState.Deleted;
                }
            }

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                var entities = string.Join(", ", ex.Entries.Select(e => e.Entity.GetType().Name).Distinct());
                throw new InvalidOperationException($"Concurrency failure on UpdateNonConformiteCommand for NonConformite {id}. Entities: {entities}", ex);
            }

            return CreateNonConformiteCommand.MapToDto(nc);
        }
    }

}
