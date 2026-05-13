using Application.Cartographie.Commands;
using Application.Cartographie.Queries;
using backend.Application.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers;

[ApiController]
[Route("api/cartographie")]
[Authorize(Policy = "SmsiTenantScope")]
[RequirePermission("cartographie")]
public class CartographieController : ControllerBase
{
    private readonly IMediator _mediator;
    public CartographieController(IMediator mediator) => _mediator = mediator;

    private int? CurrentSocieteId => int.TryParse(User.FindFirstValue("SocieteId"), out var id) ? id : null;
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? string.Empty;


    // -- Processus ----------------------------------------------

    [HttpGet("processus")]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetAllProcessusQuery(CurrentSocieteId), ct));

    [HttpGet("processus/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProcessusByIdQuery(id, CurrentSocieteId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("processus")]
    public async Task<IActionResult> Create([FromBody] CreateProcessusCommand cmd, CancellationToken ct)
    {
        var command = cmd with { SocieteId = CurrentSocieteId };
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("processus/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProcessusBody body, CancellationToken ct)
    {
        await _mediator.Send(new UpdateProcessusCommand(
            id,
            body.Categorie,
            body.Nom,
            body.Responsable,
            body.Description,
            CurrentSocieteId,
            CurrentUserId), ct);
        return NoContent();
    }

    [HttpDelete("processus/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteProcessusCommand(id, CurrentSocieteId, CurrentUserId), ct);
        return NoContent();
    }

    // -- Documents ----------------------------------------------

    [HttpPost("processus/{processusId:guid}/documents")]
    [RequirePermission("cartographie", "import")]
    public async Task<IActionResult> AddDocument(
        Guid processusId,
        [FromForm] AddDocumentBody body,
        IFormFile? fichier,
        CancellationToken ct)
    {
        byte[]? fichierData = null;
        string? fichierNom = null;
        string? fichierType = null;

        if (fichier is { Length: > 0 })
        {
            fichierNom = fichier.FileName;
            fichierType = fichier.ContentType;

            using var ms = new MemoryStream();
            await fichier.CopyToAsync(ms, ct);
            fichierData = ms.ToArray();
        }

        var result = await _mediator.Send(
            new AddDocumentCommand(processusId, body.Nom, body.Type,
                                   body.Reference, body.Statut,
                                   fichierNom, fichierType, fichierData, CurrentSocieteId, CurrentUserId), ct);

        return Ok(result);
    }

    [HttpGet("documents/{documentId:guid}/fichier")]
    [RequirePermission("cartographie", "export")]
    public async Task<IActionResult> DownloadFichier(Guid documentId, CancellationToken ct)
    {
        var doc = await _mediator.Send(new GetDocumentFichierQuery(documentId, CurrentSocieteId), ct);
        if (doc?.FichierData == null) return NotFound();
        return File(doc.FichierData, doc.FichierType ?? "application/octet-stream", doc.FichierNom);
    }

    [HttpDelete("processus/{processusId:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid processusId, Guid documentId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteDocumentCommand(processusId, documentId, CurrentSocieteId, CurrentUserId), ct);
        return NoContent();
    }
}

// Request bodies — déclarés UNE SEULE FOIS, en dehors de la classe
public record UpdateProcessusBody(string Categorie, string Nom, string Responsable, string Description);
public record AddDocumentBody(string Nom, string Type, string Reference, string Statut);
