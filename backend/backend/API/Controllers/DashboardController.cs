using backend.Application.Dashboard.Queries.GetGlobalDashboard;
using backend.Application.DTOs.Dashboard;
using backend.Application.Security;
using backend.API.Middleware;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [Authorize(Policy = "SmsiTenantScope")]
    [ApiController]
    [Route("api/[controller]")]
    [RequirePermission("dashboard")]
    public class DashboardController : ControllerBase
    {
        private const string TraceActionOverrideItemKey = UserActivityTraceMiddleware.ActionOverrideItemKey;
        private readonly IMediator _mediator;
        private readonly AppDbContext _context;

        public DashboardController(IMediator mediator, AppDbContext context)
        {
            _mediator = mediator;
            _context = context;
        }

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

        [HttpGet("global")]
        public async Task<IActionResult> GetGlobal() =>
            Ok(await _mediator.Send(new GetGlobalDashboardQuery(CurrentSocieteId)));

        [HttpGet("snapshots")]
        public async Task<IActionResult> GetSnapshots([FromQuery] int months = 12)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var safeMonths = Math.Clamp(months, 1, 36);
            var now = DateTime.UtcNow;
            var monthStartUtc = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var minMonthStartUtc = monthStartUtc.AddMonths(-(safeMonths - 1));

            var snapshots = await _context.DashboardMonthlySnapshots
                .AsNoTracking()
                .Where(x => x.SocieteId == CurrentSocieteId.Value && x.MonthStartUtc >= minMonthStartUtc)
                .OrderByDescending(x => x.MonthStartUtc)
                .Select(x => new DashboardMonthlySnapshotDto
                {
                    Id = x.Id,
                    MonthStartUtc = x.MonthStartUtc,
                    GlobalConformity = x.GlobalConformity,
                    IncidentsCount = x.IncidentsCount,
                    AuditsCompleted = x.AuditsCompleted,
                    PdcaCompleted = x.PdcaCompleted,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(snapshots);
        }

        [HttpPost("snapshots/upsert")]
        public async Task<IActionResult> UpsertSnapshot([FromBody] UpsertDashboardMonthlySnapshotRequest request)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var rawDate = request.MonthStartUtc ?? DateTime.UtcNow;
            var monthStartUtc = new DateTime(rawDate.Year, rawDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var snapshot = await _context.DashboardMonthlySnapshots
                .SingleOrDefaultAsync(x => x.SocieteId == CurrentSocieteId.Value && x.MonthStartUtc == monthStartUtc);

            var isCreate = snapshot is null;
            HttpContext.Items[TraceActionOverrideItemKey] = isCreate
                ? PermissionCatalog.Actions.Create
                : PermissionCatalog.Actions.Edit;

            if (snapshot is null)
            {
                snapshot = new Domain.Entities.DashboardMonthlySnapshot
                {
                    Id = Guid.NewGuid(),
                    SocieteId = CurrentSocieteId.Value,
                    MonthStartUtc = monthStartUtc,
                    GlobalConformity = request.GlobalConformity,
                    IncidentsCount = request.IncidentsCount,
                    AuditsCompleted = request.AuditsCompleted,
                    PdcaCompleted = request.PdcaCompleted,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _context.DashboardMonthlySnapshots.Add(snapshot);
            }
            else
            {
                snapshot.GlobalConformity = request.GlobalConformity;
                snapshot.IncidentsCount = request.IncidentsCount;
                snapshot.AuditsCompleted = request.AuditsCompleted;
                snapshot.PdcaCompleted = request.PdcaCompleted;
                snapshot.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new DashboardMonthlySnapshotDto
            {
                Id = snapshot.Id,
                MonthStartUtc = snapshot.MonthStartUtc,
                GlobalConformity = snapshot.GlobalConformity,
                IncidentsCount = snapshot.IncidentsCount,
                AuditsCompleted = snapshot.AuditsCompleted,
                PdcaCompleted = snapshot.PdcaCompleted,
                CreatedAt = snapshot.CreatedAt,
                UpdatedAt = snapshot.UpdatedAt,
            });
        }

        [HttpDelete("snapshots/{id:guid}")]
        public async Task<IActionResult> DeleteSnapshot(Guid id)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var snapshot = await _context.DashboardMonthlySnapshots
                .SingleOrDefaultAsync(x => x.Id == id && x.SocieteId == CurrentSocieteId.Value);

            if (snapshot is null)
            {
                return NotFound();
            }

            HttpContext.Items[TraceActionOverrideItemKey] = PermissionCatalog.Actions.Delete;
            _context.DashboardMonthlySnapshots.Remove(snapshot);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
