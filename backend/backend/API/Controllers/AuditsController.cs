using Application.Audits.Commands;
using Application.DTOs;
using backend.Application.Audits.Commands;
using backend.Application.Audits.Queries;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.API.Controllers;

[ApiController]
[Route("api/audits")]
[Authorize]
public class AuditsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditsController(AppDbContext db) => _db = db;

    private int? CurrentSocieteId
    {
        get
        {
            var value = User.FindFirstValue("SocieteId");
            return int.TryParse(value, out var parsed) ? parsed : null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await new GetAllAuditsQuery(_db).ExecuteAsync(CurrentSocieteId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await new GetAuditByIdQuery(_db).ExecuteAsync(id, CurrentSocieteId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await new CreateAuditCommand(_db).ExecuteAsync(dto, CurrentSocieteId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAuditDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await new UpdateAuditCommand(_db).ExecuteAsync(id, dto, CurrentSocieteId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await new DeleteAuditCommand(_db).ExecuteAsync(id, CurrentSocieteId);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("ncs")]
    public async Task<IActionResult> GetAllNCs()
    {
        var result = await new GetAllNonConformitesQuery(_db).ExecuteAsync(CurrentSocieteId);
        return Ok(result);
    }

    [HttpGet("ncs/{id:guid}")]
    public async Task<IActionResult> GetNCById(Guid id)
    {
        var result = await new GetNonConformiteByIdQuery(_db).ExecuteAsync(id, CurrentSocieteId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("ncs")]
    public async Task<IActionResult> CreateNC([FromBody] CreateNonConformiteDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await new CreateNonConformiteCommand(_db).ExecuteAsync(dto, CurrentSocieteId);
        return CreatedAtAction(nameof(GetNCById), new { id = result.Id }, result);
    }

    [HttpPut("ncs/{id:guid}")]
    public async Task<IActionResult> UpdateNC(Guid id, [FromBody] UpdateNonConformiteDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await new UpdateNonConformiteCommand(_db).ExecuteAsync(id, dto, CurrentSocieteId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("ncs/{id:guid}")]
    public async Task<IActionResult> DeleteNC(Guid id)
    {
        var ok = await new DeleteNonConformiteCommand(_db).ExecuteAsync(id, CurrentSocieteId);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("simulations")]
    public async Task<IActionResult> GetAllSimulations()
    {
        var result = await new GetAllSimulationsQuery(_db).ExecuteAsync(CurrentSocieteId);
        return Ok(result);
    }

    [HttpPost("simulations")]
    public async Task<IActionResult> CreateSimulation([FromBody] CreateSimulationAuditDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await new CreateSimulationCommand(_db).ExecuteAsync(dto, CurrentSocieteId);
        return CreatedAtAction(nameof(GetAllSimulations), new { id = result.Id }, result);
    }

    [HttpDelete("simulations/{id:guid}")]
    public async Task<IActionResult> DeleteSimulation(Guid id)
    {
        var ok = await new DeleteSimulationCommand(_db).ExecuteAsync(id, CurrentSocieteId);
        return ok ? NoContent() : NotFound();
    }
}
