using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.DTOs.Clause;
using backend.Application.Security;
using backend.Domain.Interfaces;
using backend.Infrastructure.Services;

namespace backend.API.Controllers;

[ApiController]
[Route("api/clauses")]
[Authorize(Policy = "SmsiTenantScope")]
[RequirePermission("clauses")]
public class ClauseFileController : ControllerBase
{
    private readonly IClauseService _svc;
    private readonly IDocumentationProofLinkService _documentationProofLinkService;

    public ClauseFileController(
        IClauseService svc,
        IDocumentationProofLinkService documentationProofLinkService)
    {
        _svc = svc;
        _documentationProofLinkService = documentationProofLinkService;
    }

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
    // CONFORMITY PROOFS  (inchangé — proofId est bien un int en base)
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
            var result = await _svc.UploadConformityProofFileAsync(proofId, UserId, CurrentSocieteId, file, description);
            try
            {
                await _documentationProofLinkService.FindOrCreateFromFormFileAndLinkAsync(
                    file,
                    UserId,
                    clauseReference: null,
                    controleReference: null,
                    processusReference: null,
                    description: description,
                    requestedType: null,
                    sourceModule: "clauses",
                    controleDomaine: null,
                    cancellationToken: HttpContext.RequestAborted);
            }
            catch
            {
                // Ne pas bloquer l'enregistrement du fichier de preuve si la synchronisation échoue.
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("proofs/files/{fileId:int}")]
    public async Task<IActionResult> DeleteProofFile(int fileId)
        => await _svc.DeleteConformityProofFileAsync(fileId, UserId, CurrentSocieteId) ? NoContent() : NotFound();

    // ══════════════════════════════════════════════════════════════════════════
    // ACTION PLAN DOCUMENTS
    // CORRECTION : les routes utilisent le GUID réel du plan (ActionPlanDto.GuidId),
    // pas le hashcode int. Cela garantit que la recherche en base réussit.
    // Côté frontend, utiliser plan.guidId (pas plan.id) pour ces appels.
    // ══════════════════════════════════════════════════════════════════════════

    [HttpGet("plans/{planGuidId:guid}/files")]
    public async Task<IActionResult> GetPlanFiles(Guid planGuidId)
        => Ok(await _svc.GetActionPlanFilesAsync(planGuidId, UserId, CurrentSocieteId));

    [HttpPost("plans/{planGuidId:guid}/files")]
    [RequirePermission("clauses", "import")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> UploadPlanFile(
        Guid planGuidId, IFormFile file, [FromForm] string? description = null)
    {
        if (file is null || file.Length == 0) return BadRequest("Fichier manquant.");
        try
        {
            var result = await _svc.UploadActionPlanFileAsync(planGuidId, UserId, CurrentSocieteId, file, description);
            try
            {
                await _documentationProofLinkService.FindOrCreateFromFormFileAndLinkAsync(
                    file,
                    UserId,
                    clauseReference: null,
                    controleReference: null,
                    processusReference: null,
                    description: description,
                    requestedType: null,
                    sourceModule: "clauses",
                    controleDomaine: null,
                    cancellationToken: HttpContext.RequestAborted);
            }
            catch
            {
                // Ne pas bloquer l'enregistrement du fichier de plan d'action si la synchronisation échoue.
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("plans/files/{fileId:int}")]
    public async Task<IActionResult> DeletePlanFile(int fileId)
        => await _svc.DeleteActionPlanFileAsync(fileId, UserId, CurrentSocieteId) ? NoContent() : NotFound();

    // ══════════════════════════════════════════════════════════════════════════
    // DOWNLOAD — fileId est un int en base (FileAttachment.Id), inchangé
    // ══════════════════════════════════════════════════════════════════════════

    [HttpGet("files/{fileId:int}/download")]
    [RequirePermission("clauses", "export")]
    public async Task<IActionResult> Download(int fileId)
    {
        var result = await _svc.DownloadFileAsync(fileId, UserId, CurrentSocieteId);
        if (result is null) return NotFound();

        var (content, contentType, fileName) = result.Value;

        Response.Headers.Append(
            "Content-Disposition",
            $"attachment; filename=\"{Uri.EscapeDataString(fileName)}\"");

        return File(content, contentType, fileName);
    }
}
