using Application.DTOs.Clause;
using Microsoft.AspNetCore.Http;

namespace backend.Infrastructure.Services
{
    public interface IClauseService
    {
        // Clauses
        Task<List<IsoClauseDto>> GetClausesAsync();
        Task<IsoClauseDto?> GetClauseAsync(int id);
        Task SeedClausesAsync();

        // Conformity
        Task<ConformityStatusDto?> GetConformityAsync(int clauseId, string userId, int? societeId);
        Task<ConformityStatusDto> UpsertConformityAsync(int clauseId, string userId, int? societeId, UpsertConformityDto dto);

        // Conformity proofs
        Task<List<ConformityProofDto>> GetConformityProofsAsync(int subClauseId, string userId, int? societeId);
        Task<ConformityProofDto> UpsertConformityProofAsync(int subClauseId, string userId, int? societeId, UpsertConformityProofDto dto);
        Task<FileAttachmentDto> UploadConformityProofFileAsync(int proofId, string userId, int? societeId, IFormFile file, string? description, string? documentType = null);
        Task<bool> DeleteConformityProofFileAsync(int fileId, string userId, int? societeId);

        // Action plans
        Task<List<ActionPlanDto>> GetActionPlansAsync(int clauseId, string userId, int? societeId);
        Task<ActionPlanDto?> GetActionPlanAsync(int id, string userId, int? societeId);
        Task<ActionPlanDto> CreateActionPlanAsync(string userId, int? societeId, CreateActionPlanDto dto);
        Task<ActionPlanDto?> UpdateActionPlanAsync(int id, string userId, int? societeId, UpdateActionPlanDto dto);
        Task<bool> DeleteActionPlanAsync(int id, string userId, int? societeId);

        // Action plan documents
        Task<List<FileAttachmentDto>> GetActionPlanFilesAsync(int planId, string userId, int? societeId);
        Task<FileAttachmentDto> UploadActionPlanFileAsync(int planId, string userId, int? societeId, IFormFile file, string? description);
        Task<bool> DeleteActionPlanFileAsync(int fileId, string userId, int? societeId);

        // Download
        Task<(byte[] content, string contentType, string fileName)?> DownloadFileAsync(int fileId, string userId, int? societeId);

        // Dashboard
        Task<List<ClauseDashboardDto>> GetDashboardAsync(string userId, int? societeId);
        Task<GlobalStatsDto> GetGlobalStatsAsync(string userId, int? societeId);
    }
}
