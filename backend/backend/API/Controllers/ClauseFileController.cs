using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.DTOs.Clause;
using backend.Application.Security;
using backend.Infrastructure.Services;

namespace backend.API.Controllers;

[ApiController]
[Route("api/clauses")]
[Authorize(Policy = "SmsiTenantScope")]
[RequirePermission("clauses")]
public class ClauseFileController : ControllerBase
{
    private readonly IClauseService _svc;
    public ClauseFileController(IClauseService svc) => _svc = svc;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub") ?? "";

    private int? CurrentSocieteId
    {
        get
        {
            var value = User.FindFirstValue("SocieteId");
            return int.TryParse(value, out var parsed) ? parsed : null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CONFORMITY PROOFS
    // ══════════════════════════════════════════════════════════════════════════

    [HttpGet("proofs/{subClauseId:int}")]
    public async Task<IActionResult> GetProofs(int subClauseId)
        => Ok(await _svc.GetConformityProofsAsync(subClauseId, UserId, CurrentSocieteId));

    [HttpPost("proofs")]
    public async Task<IActionResult> UpsertProof([FromBody] UpsertConformityProofDto dto)
        => Ok(await _svc.UpsertConformityProofAsync(dto.IsoClauseId, UserId, CurrentSocieteId, dto));

    [HttpPost("proofs/{proofId:int}/files")]
    [RequirePermission("clauses", "import")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> UploadProofFile(
        int proofId, IFormFile file, [FromForm] string? description = null)
    {
        if (file is null || file.Length == 0) return BadRequest("Fichier manquant.");
        try
        {
            return Ok(await _svc.UploadConformityProofFileAsync(proofId, UserId, CurrentSocieteId, file, description));
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("proofs/files/{fileId:int}")]
    public async Task<IActionResult> DeleteProofFile(int fileId)
        => await _svc.DeleteConformityProofFileAsync(fileId, UserId, CurrentSocieteId) ? NoContent() : NotFound();

    // ══════════════════════════════════════════════════════════════════════════
    // ACTION PLAN DOCUMENTS
    // ══════════════════════════════════════════════════════════════════════════

    [HttpGet("plans/{planId:int}/files")]
    public async Task<IActionResult> GetPlanFiles(int planId)
        => Ok(await _svc.GetActionPlanFilesAsync(planId, UserId, CurrentSocieteId));

    [HttpPost("plans/{planId:int}/files")]
    [RequirePermission("clauses", "import")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> UploadPlanFile(
        int planId, IFormFile file, [FromForm] string? description = null)
    {
        if (file is null || file.Length == 0) return BadRequest("Fichier manquant.");
        try
        {
            return Ok(await _svc.UploadActionPlanFileAsync(planId, UserId, CurrentSocieteId, file, description));
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("plans/files/{fileId:int}")]
    public async Task<IActionResult> DeletePlanFile(int fileId)
        => await _svc.DeleteActionPlanFileAsync(fileId, UserId, CurrentSocieteId) ? NoContent() : NotFound();

    // ══════════════════════════════════════════════════════════════════════════
    // DOWNLOAD — lit le contenu depuis la base, aucun fichier disque
    // ══════════════════════════════════════════════════════════════════════════

    [HttpGet("files/{fileId:int}/download")]
    [RequirePermission("clauses", "export")]
    public async Task<IActionResult> Download(int fileId)
    {
        var result = await _svc.DownloadFileAsync(fileId, UserId, CurrentSocieteId);
        if (result is null) return NotFound();

        var (content, contentType, fileName) = result.Value;

        // Content-Disposition: attachment → force le téléchargement côté navigateur
        Response.Headers.Append(
            "Content-Disposition",
            $"attachment; filename=\"{Uri.EscapeDataString(fileName)}\"");

        return File(content, contentType, fileName);
    }
}
