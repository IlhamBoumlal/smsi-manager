using Application.DTOs.Clause;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Services
{
    public interface IClauseService
    {
        // ── CLAUSES ───────────────────────────────────────────────────────────
        Task<List<IsoClauseDto>> GetClausesAsync();
        Task<IsoClauseDto?> GetClauseAsync(int id);
        Task SeedClausesAsync();

        // ── CONFORMITY ────────────────────────────────────────────────────────
        Task<ConformityStatusDto?> GetConformityAsync(int clauseId, string userId);
        Task<ConformityStatusDto> UpsertConformityAsync(int clauseId, string userId, UpsertConformityDto dto);

        // ── CONFORMITY PROOFS ─────────────────────────────────────────────────
        Task<List<ConformityProofDto>> GetConformityProofsAsync(int subClauseId, string userId);
        Task<ConformityProofDto> UpsertConformityProofAsync(int subClauseId, string userId, UpsertConformityProofDto dto);
        Task<FileAttachmentDto> UploadConformityProofFileAsync(int proofId, string userId, IFormFile file, string? description);
        Task<bool> DeleteConformityProofFileAsync(int fileId, string userId);

        // ── ACTION PLANS ──────────────────────────────────────────────────────
        Task<List<ActionPlanDto>> GetActionPlansAsync(int clauseId, string userId);
        Task<ActionPlanDto?> GetActionPlanAsync(int id, string userId);
        Task<ActionPlanDto> CreateActionPlanAsync(string userId, CreateActionPlanDto dto);
        Task<ActionPlanDto?> UpdateActionPlanAsync(int id, string userId, UpdateActionPlanDto dto);
        Task<bool> DeleteActionPlanAsync(int id, string userId);

        // ── ACTION PLAN DOCUMENTS ─────────────────────────────────────────────
        Task<List<FileAttachmentDto>> GetActionPlanFilesAsync(int planId, string userId);
        Task<FileAttachmentDto> UploadActionPlanFileAsync(int planId, string userId, IFormFile file, string? description);
        Task<bool> DeleteActionPlanFileAsync(int fileId, string userId);

        // ── DOWNLOAD ─────────────────────────────────────────────────────────
        // Contenu binaire lu depuis la base — pas de système de fichiers.
        Task<(byte[] content, string contentType, string fileName)?> DownloadFileAsync(int fileId, string userId);

        // ── DASHBOARD ─────────────────────────────────────────────────────────
        Task<List<ClauseDashboardDto>> GetDashboardAsync(string userId);
        Task<GlobalStatsDto> GetGlobalStatsAsync(string userId);
    }
}