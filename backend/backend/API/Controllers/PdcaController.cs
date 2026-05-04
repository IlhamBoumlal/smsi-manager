using System.Security.Claims;
using Application.PDCA.Commands.AddItem;
using Application.PDCA.Commands.AddSection;
using Application.PDCA.Commands.CreateCycle;
using Application.PDCA.Commands.DeleteItem;
using Application.PDCA.Commands.DeleteSection;
using Application.PDCA.Commands.RenameSection;
using Application.PDCA.Commands.UpdateItem;
using Application.PDCA.Queries.GetCycleById;
using Application.PDCA.Queries.GetCycles;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers;

[Authorize(Policy = "SmSiSocieteScope")]
[ApiController]
[Route("api/pdca")]
public class PdcaController : ControllerBase
{
    private readonly IMediator _mediator;
    public PdcaController(IMediator mediator) => _mediator = mediator;

    private int? CurrentSocieteId
    {
        get
        {
            var value = User.FindFirstValue("SocieteId");
            return int.TryParse(value, out var parsed) ? parsed : null;
        }
    }

    [HttpGet("cycles")]
    public async Task<IActionResult> GetCycles(CancellationToken ct)
        => Ok(await _mediator.Send(new GetCyclesQuery(CurrentSocieteId), ct));

    [HttpGet("cycles/{id:guid}")]
    public async Task<IActionResult> GetCycle(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCycleByIdQuery(id, CurrentSocieteId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("cycles")]
    public async Task<IActionResult> CreateCycle([FromBody] CreateCycleBody body, CancellationToken ct)
    {
        var id = await _mediator.Send(new CreateCycleCommand(body.Name, CurrentSocieteId), ct);
        return CreatedAtAction(nameof(GetCycle), new { id }, new { id });
    }

    [HttpPost("sections")]
    public async Task<IActionResult> AddSection([FromBody] AddSectionCommand cmd, CancellationToken ct)
        => Ok(new { id = await _mediator.Send(cmd with { SocieteId = CurrentSocieteId }, ct) });

    [HttpPut("sections/{id:guid}")]
    public async Task<IActionResult> RenameSection(Guid id, [FromBody] RenameSectionBody body, CancellationToken ct)
    {
        await _mediator.Send(new RenameSectionCommand(id, body.Title, CurrentSocieteId), ct);
        return NoContent();
    }

    [HttpDelete("sections/{id:guid}")]
    public async Task<IActionResult> DeleteSection(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteSectionCommand(id, CurrentSocieteId), ct);
        return NoContent();
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddItemCommand cmd, CancellationToken ct)
        => Ok(new { id = await _mediator.Send(cmd with { SocieteId = CurrentSocieteId }, ct) });

    [HttpPut("items/{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemBody body, CancellationToken ct)
    {
        await _mediator.Send(new UpdateItemCommand(id, body.Status, body.Text, CurrentSocieteId), ct);
        return NoContent();
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteItemCommand(id, CurrentSocieteId), ct);
        return NoContent();
    }
}

public record CreateCycleBody(string Name);
public record RenameSectionBody(string Title);
public record UpdateItemBody(string? Status = null, string? Text = null);
