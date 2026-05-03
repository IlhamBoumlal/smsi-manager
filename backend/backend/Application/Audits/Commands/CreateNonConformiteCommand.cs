using Application.DTOs;
using backend.Infrastructure.Data;
using backend.Domain.Entities;

namespace backend.Application.Audits.Commands
{
    public class CreateNonConformiteCommand
    {
        private readonly AppDbContext _db;
        public CreateNonConformiteCommand(AppDbContext db) => _db = db;

        public async Task<NonConformiteDto> ExecuteAsync(CreateNonConformiteDto dto, int? societeId)
        {
            if (!societeId.HasValue || societeId.Value <= 0)
                throw new InvalidOperationException("SocieteId obligatoire pour creer une non-conformite.");

            var nc = new NonConformite
            {
                SocieteId = societeId.Value,
                Title = dto.Title,
                Description = dto.Description,
                ControlId = dto.ControlId,
                Actor = dto.Actor,
                CorrectiveAction = dto.CorrectiveAction,
                Responsible = dto.Responsible,
                Deadline = string.IsNullOrWhiteSpace(dto.Deadline) ? null : DateTime.Parse(dto.Deadline),
                Status = dto.Status,
                AuditName = dto.AuditName,
                AuditId = dto.AuditId,
            };

            foreach (var a in dto.CorrectiveActions)
                nc.CorrectiveActions.Add(new ActionCorrective
                {
                    Description = a.Description,
                    Responsible = a.Responsible,
                    Deadline = string.IsNullOrWhiteSpace(a.Deadline) ? null : DateTime.Parse(a.Deadline),
                    Status = a.Status,
                });

            _db.NonConformites.Add(nc);
            await _db.SaveChangesAsync();
            return MapToDto(nc);
        }

        internal static NonConformiteDto MapToDto(NonConformite nc) => new()
        {
            Id = nc.Id,
            Title = nc.Title,
            Description = nc.Description,
            ControlId = nc.ControlId,
            Actor = nc.Actor,
            CorrectiveAction = nc.CorrectiveAction,
            Responsible = nc.Responsible,
            Deadline = nc.Deadline?.ToString("yyyy-MM-dd"),
            Status = nc.Status,
            AuditName = nc.AuditName,
            AuditId = nc.AuditId,
            CreatedAt = nc.CreatedAt,
            CorrectiveActions = nc.CorrectiveActions.Select(a => new ActionCorrectiveDto
            {
                Id = a.Id,
                Description = a.Description,
                Responsible = a.Responsible,
                Deadline = a.Deadline?.ToString("yyyy-MM-dd"),
                Status = a.Status,
            }).ToList(),
        };
    }
}
