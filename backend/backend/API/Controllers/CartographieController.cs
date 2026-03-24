using Application.Cartographie.Commands;
using Application.Cartographie.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/cartographie")]
[Authorize]
public class CartographieController : ControllerBase
{
    private readonly IMediator _mediator;
    public CartographieController(IMediator mediator) => _mediator = mediator;


    // ── Processus ──────────────────────────────────────────────

    [HttpGet("processus")]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetAllProcessusQuery(), ct));

    [HttpGet("processus/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProcessusByIdQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("processus")]
    public async Task<IActionResult> Create([FromBody] CreateProcessusCommand cmd, CancellationToken ct)
    {
        var result = await _mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("processus/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProcessusBody body, CancellationToken ct)
    {
        await _mediator.Send(new UpdateProcessusCommand(id, body.Categorie, body.Nom, body.Responsable, body.Description), ct);
        return NoContent();
    }

    [HttpDelete("processus/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteProcessusCommand(id), ct);
        return NoContent();
    }

    // ── Documents ──────────────────────────────────────────────

    // Upload avec fichier binaire
    [HttpPost("processus/{processusId:guid}/documents")]
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
                                   fichierNom, fichierType, fichierData), ct);

        return Ok(result);
    }

    // Téléchargement du fichier
    [HttpGet("documents/{documentId:guid}/fichier")]
    public async Task<IActionResult> DownloadFichier(Guid documentId, CancellationToken ct)
    {
        var doc = await _mediator.Send(new GetDocumentFichierQuery(documentId), ct);
        if (doc?.FichierData == null) return NotFound();
        return File(doc.FichierData, doc.FichierType ?? "application/octet-stream", doc.FichierNom);
    }

    public record AddDocumentBody(string Nom, string Type, string Reference, string Statut);

    [HttpDelete("processus/{processusId:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid processusId, Guid documentId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteDocumentCommand(processusId, documentId), ct);
        return NoContent();
    }
}

// Request bodies (séparés de la Command pour éviter de binder l'Id depuis le body)
public record UpdateProcessusBody(string Categorie, string Nom, string Responsable, string Description);
public record AddDocumentBody(string Nom, string Type, string Reference, string Statut);