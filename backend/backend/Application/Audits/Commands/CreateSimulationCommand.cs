using Application.DTOs;
using backend.Infrastructure.Data;
using backend.Domain.Entities;
using System.Text.Json;

namespace backend.Application.Audits.Commands
{
    public class CreateSimulationCommand
    {
        private readonly AppDbContext _db;
        public CreateSimulationCommand(AppDbContext db) => _db = db;

        public async Task<SimulationAuditDto> ExecuteAsync(CreateSimulationAuditDto dto, int? societeId)
        {
            if (!societeId.HasValue || societeId.Value <= 0)
                throw new InvalidOperationException("SocieteId obligatoire pour creer une simulation.");

            var sim = new SimulationAudit
            {
                SocieteId = societeId.Value,
                Name = dto.Name,
                Author = dto.Author,
                Date = string.IsNullOrWhiteSpace(dto.Date) ? DateTime.UtcNow : DateTime.Parse(dto.Date),
                Score = dto.Score,
                TotalAnswered = dto.TotalAnswered,
                TotalOui = dto.Oui,
                TotalNon = dto.Non,
                AnswersJson = JsonSerializer.Serialize(dto.Answers),
                CommentsJson = JsonSerializer.Serialize(dto.Comments),
            };

            _db.SimulationAudits.Add(sim);
            await _db.SaveChangesAsync();
            return MapToDto(sim);
        }

        internal static SimulationAuditDto MapToDto(SimulationAudit s) => new()
        {
            Id = s.Id,
            Name = s.Name,
            Author = s.Author,
            Date = s.Date.ToString("yyyy-MM-dd"),
            Score = s.Score,
            TotalAnswered = s.TotalAnswered,
            Oui = s.TotalOui,
            Non = s.TotalNon,
            Answers = JsonSerializer.Deserialize<Dictionary<string, string>>(s.AnswersJson) ?? new(),
            Comments = JsonSerializer.Deserialize<Dictionary<string, string>>(s.CommentsJson) ?? new(),
        };
    }

}
