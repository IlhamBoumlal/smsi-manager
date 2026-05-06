using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.DTOs.Clause;
using backend.Infrastructure.Services;

namespace backend.API.Controllers;

[ApiController]
[Route("api/clauses")]
[Authorize]
public class ClauseController : ControllerBase
{
    private readonly IClauseService _svc;
    public ClauseController(IClauseService svc) => _svc = svc;

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

    // ── ISO CLAUSES (référentiel) ──────────────────────────────────────────

    /// GET /api/clauses
    [HttpGet]
    public async Task<IActionResult> GetClauses()
    {
        await _svc.SeedClausesAsync();
        return Ok(await _svc.GetClausesAsync());
    }

    /// GET /api/clauses/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetClause(int id)
    {
        var clause = await _svc.GetClauseAsync(id);
        return clause is null ? NotFound() : Ok(clause);
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────

    /// GET /api/clauses/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        await _svc.SeedClausesAsync();
        return Ok(await _svc.GetDashboardAsync(UserId, CurrentSocieteId));
    }

    /// GET /api/clauses/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
        => Ok(await _svc.GetGlobalStatsAsync(UserId, CurrentSocieteId));

    // ── CONFORMITY ────────────────────────────────────────────────────────

    /// GET /api/clauses/conformity/{subClauseId}
    /// Retourne 200 + null si la sous-clause n'a pas encore été évaluée
    /// (évite les 404 en cascade côté frontend au chargement initial).
    [HttpGet("conformity/{subClauseId:int}")]
    public async Task<IActionResult> GetConformity(int subClauseId)
    {
        var cs = await _svc.GetConformityAsync(subClauseId, UserId, CurrentSocieteId);
        // On retourne toujours 200 ; le frontend vérifie cs != null
        return Ok(cs);
    }

    /// POST /api/clauses/conformity  (création)
    /// Même logique qu'un PUT — l'upsert est idempotent.
    [HttpPost("conformity")]
    public async Task<IActionResult> CreateConformity([FromBody] UpsertConformityDto dto)
        => Ok(await _svc.UpsertConformityAsync(dto.SubClauseId, UserId, CurrentSocieteId, dto));

    /// PUT /api/clauses/conformity  (mise à jour ou création)
    [HttpPut("conformity")]
    public async Task<IActionResult> UpsertConformity([FromBody] UpsertConformityDto dto)
        => Ok(await _svc.UpsertConformityAsync(dto.SubClauseId, UserId, CurrentSocieteId, dto));

    // ── ACTION PLANS ──────────────────────────────────────────────────────

    /// GET /api/clauses/plans?isoClauseId={clauseId}
    [HttpGet("plans")]
    public async Task<IActionResult> GetActionPlans([FromQuery] int isoClauseId)
        => Ok(await _svc.GetActionPlansAsync(isoClauseId, UserId, CurrentSocieteId));

    /// GET /api/clauses/plans/{id}
    [HttpGet("plans/{id:int}")]
    public async Task<IActionResult> GetActionPlan(int id)
    {
        var ap = await _svc.GetActionPlanAsync(id, UserId, CurrentSocieteId);
        return ap is null ? NotFound() : Ok(ap);
    }

    /// POST /api/clauses/plans
    [HttpPost("plans")]
    public async Task<IActionResult> CreateActionPlan([FromBody] CreateActionPlanDto dto)
    {
        var ap = await _svc.CreateActionPlanAsync(UserId, CurrentSocieteId, dto);
        return CreatedAtAction(nameof(GetActionPlan), new { id = ap.Id }, ap);
    }

    /// PUT /api/clauses/plans/{id:int}
    [HttpPut("plans/{id:int}")]
    public async Task<IActionResult> UpdateActionPlan(int id, [FromBody] UpdateActionPlanDto dto)
    {
        var ap = await _svc.UpdateActionPlanAsync(id, UserId, CurrentSocieteId, dto);
        return ap is null ? NotFound() : Ok(ap);
    }

    /// DELETE /api/clauses/plans/{id:int}
    [HttpDelete("plans/{id:int}")]
    public async Task<IActionResult> DeleteActionPlan(int id)
    {
        var ok = await _svc.DeleteActionPlanAsync(id, UserId, CurrentSocieteId);
        return ok ? NoContent() : NotFound();
    }
}