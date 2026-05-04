// API/Controllers/SensibilisationController.cs
using backend.Application.Sensibilisation.Commands.CreateFormation;
using backend.Application.Sensibilisation.Commands.DeleteFormation;
using backend.Application.Sensibilisation.Commands.DeleteFormationDocument;
using backend.Application.Sensibilisation.Commands.NotifyParticipants;
using backend.Application.Sensibilisation.Commands.UpdateFormation;
using backend.Application.Sensibilisation.Commands.UpdateParticipantStatus;
using backend.Application.Sensibilisation.Commands.UploadFormationDocument;
using backend.Application.Sensibilisation.Queries.GetDashboard;
using backend.Application.Sensibilisation.Queries.GetFormationDetail;
using backend.Application.Sensibilisation.Queries.GetFormationDocument;
using backend.Application.Sensibilisation.Queries.GetFormations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers;

[Authorize(Policy = "SmSiSocieteScope")]
[ApiController]
[Route("api/sensibilisation")]
public class SensibilisationController(IMediator mediator) : ControllerBase
{
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? string.Empty;

    private int? CurrentSocieteId
    {
        get
        {
            var value = User.FindFirstValue("SocieteId");
            return int.TryParse(value, out var parsed) ? parsed : null;
        }
    }

    // -- DASHBOARD --------------------------------------------------------------
    // GET api/sensibilisation/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(
        CancellationToken ct)
        => Ok(await mediator.Send(new GetSensibilisationDashboardQuery(CurrentSocieteId), ct));

    // -- FORMATIONS LIST --------------------------------------------------------
    // GET api/sensibilisation
    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken ct)
        => Ok(await mediator.Send(new GetFormationsQuery(CurrentSocieteId), ct));

    // -- FORMATION DETAIL -------------------------------------------------------
    // GET api/sensibilisation/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetFormationDetailQuery(id, CurrentSocieteId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // -- CREATE -----------------------------------------------------------------
    // POST api/sensibilisation
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateFormationCommand cmd, CancellationToken ct)
    {
        var commandWithSociete = cmd with { SocieteId = CurrentSocieteId };
        var id = await mediator.Send(commandWithSociete, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    // -- UPDATE -----------------------------------------------------------------
    // PUT api/sensibilisation/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateFormationCommand cmd, CancellationToken ct)
    {
        if (id != cmd.Id) return BadRequest();
        var commandWithSociete = cmd with { SocieteId = CurrentSocieteId };
        return await mediator.Send(commandWithSociete, ct) ? NoContent() : NotFound();
    }

    // -- NOTIFY -----------------------------------------------------------------
    // POST api/sensibilisation/{id}/notify
    [HttpPost("{id:guid}/notify")]
    public async Task<IActionResult> Notify(
        Guid id, [FromBody] NotifyRequest body, CancellationToken ct)
    {
        var ok = await mediator.Send(
            new NotifyParticipantsCommand(id, body.Title ?? "Notification envoyée", CurrentSocieteId), ct);
        return ok ? NoContent() : NotFound();
    }

    // -- PARTICIPANT STATUS -----------------------------------------------------
    // PUT api/sensibilisation/{id}/participants/{pid}/status
    [HttpPut("{id:guid}/participants/{pid:guid}/status")]
    public async Task<IActionResult> UpdateParticipantStatus(
        Guid id, Guid pid, [FromBody] ParticipantStatusRequest body, CancellationToken ct)
    {
        var ok = await mediator.Send(
            new UpdateParticipantStatusCommand(id, pid, body.Status, CurrentSocieteId), ct);
        return ok ? NoContent() : NotFound();
    }

    // -- DOCUMENTS --------------------------------------------------------------
    // POST api/sensibilisation/{id}/documents
    [HttpPost("{id:guid}/documents")]
    public async Task<IActionResult> UploadDocument(
        Guid id, IFormFile file, CancellationToken ct)
    {
        var doc = await mediator.Send(
            new UploadFormationDocumentCommand(id, file, CurrentSocieteId), ct);
        return Ok(doc);
    }

    // DELETE api/sensibilisation/{id}/documents/{docId}
    [HttpDelete("{id:guid}/documents/{docId:guid}")]
    public async Task<IActionResult> DeleteDocument(
        Guid id, Guid docId, CancellationToken ct)
    {
        var ok = await mediator.Send(
            new DeleteFormationDocumentCommand(id, docId, CurrentSocieteId), ct);
        return ok ? NoContent() : NotFound();
    }

    // DELETE api/sensibilisation/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteFormationCommand(id, CurrentSocieteId), ct);
        return ok ? NoContent() : NotFound();
    }
    [HttpGet("{id:guid}/documents/{docId:guid}/download")]
    public async Task<IActionResult> DownloadDocument(
    Guid id, Guid docId, CancellationToken ct)
    {
        var doc = await mediator.Send(
            new GetFormationDocumentQuery(id, docId, CurrentSocieteId), ct);

        if (doc is null) return NotFound();
        if (!System.IO.File.Exists(doc.StoragePath))
            return NotFound("Fichier introuvable sur le serveur");

        var stream = System.IO.File.OpenRead(doc.StoragePath);
        var contentType = doc.FileType == "pdf"
            ? "application/pdf"
            : "application/octet-stream";

        return File(stream, contentType);
    }
}
// -- Body records -------------------------------------------------------------
public record NotifyRequest(string? Title);
public record ParticipantStatusRequest(string Status);
