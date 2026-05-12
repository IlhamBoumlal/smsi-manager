using Application.DTOs.Clause;
using Microsoft.AspNetCore.Http;

namespace backend.Infrastructure.Services
{
    public interface IClauseService
    {
        // ── CLAUSES ───────────────────────────────────────────────────────────
        Task<List<IsoClauseDto>> GetClausesAsync();
        Task<IsoClauseDto?> GetClauseAsync(int id);
        Task SeedClausesAsync();

        // ── CONFORMITY ────────────────────────────────────────────────────────
        Task<ConformityStatusDto?> GetConformityAsync(int clauseId, string userId, int? societeId);
        Task<ConformityStatusDto> UpsertConformityAsync(int clauseId, string userId, int? societeId, UpsertConformityDto dto);

        // ── CONFORMITY PROOFS ─────────────────────────────────────────────────
        Task<List<ConformityProofDto>> GetConformityProofsAsync(int subClauseId, string userId, int? societeId);
        Task<ConformityProofDto> UpsertConformityProofAsync(int subClauseId, string userId, int? societeId, UpsertConformityProofDto dto);
        Task<FileAttachmentDto> UploadConformityProofFileAsync(int proofId, string userId, int? societeId, IFormFile file, string? description);
        Task<bool> DeleteConformityProofFileAsync(int fileId, string userId, int? societeId);

        // ── ACTION PLANS ──────────────────────────────────────────────────────
        Task<List<ActionPlanDto>> GetActionPlansAsync(int clauseId, string userId, int? societeId);
        Task<ActionPlanDto?> GetActionPlanAsync(int id, string userId, int? societeId);
        Task<ActionPlanDto> CreateActionPlanAsync(string userId, int? societeId, CreateActionPlanDto dto);
        Task<ActionPlanDto?> UpdateActionPlanAsync(int id, string userId, int? societeId, UpdateActionPlanDto dto);
        Task<bool> DeleteActionPlanAsync(int id, string userId, int? societeId);

        // ── ACTION PLAN DOCUMENTS ─────────────────────────────────────────────
        // IMPORTANT : planGuidId = ActionPlanDto.GuidId (le vrai Guid, pas le hashcode int)
        Task<List<FileAttachmentDto>> GetActionPlanFilesAsync(Guid planGuidId, string userId, int? societeId);
        Task<FileAttachmentDto> UploadActionPlanFileAsync(Guid planGuidId, string userId, int? societeId, IFormFile file, string? description);
        Task<bool> DeleteActionPlanFileAsync(int fileId, string userId, int? societeId);

        // ── DOWNLOAD ─────────────────────────────────────────────────────────
        Task<(byte[] content, string contentType, string fileName)?> DownloadFileAsync(int fileId, string userId, int? societeId);

        // ── DASHBOARD ─────────────────────────────────────────────────────────
        Task<List<ClauseDashboardDto>> GetDashboardAsync(string userId, int? societeId);
        Task<GlobalStatsDto> GetGlobalStatsAsync(string userId, int? societeId);
    }
}