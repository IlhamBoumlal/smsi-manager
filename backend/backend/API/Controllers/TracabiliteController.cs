using backend.Application.Security;
using backend.API.Middleware;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "TenantAdminScope")]
    [RequirePermission("tracabilite", "read")]
    public class TracabiliteController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private static readonly string[] ExcludedSuperAdminRoleLabels =
        [
            AppRoles.SuperAdmin,
            "SUPER ADMIN",
            "SuperAdmin",
            "SUPERADMIN",
            AppRoles.SuperAdminRoleKey
        ];

        public TracabiliteController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        private int? CurrentSocieteId
        {
            get
            {
                var value = User.FindFirstValue("SocieteId");
                return int.TryParse(value, out var parsed) ? parsed : null;
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs([FromQuery] TracabiliteQuery query, CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 10, 200);

            var filtered = BuildFilteredQuery(CurrentSocieteId.Value, query);

            var total = await filtered.CountAsync(cancellationToken);

            var logsPage = await filtered
                .OrderByDescending(log => log.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var items = new List<object>(logsPage.Count);
            foreach (var log in logsPage)
            {
                var normalizedDescription = log.Description;
                if (string.IsNullOrWhiteSpace(normalizedDescription))
                {
                    normalizedDescription = await UserActivityDescriptionGenerator.BuildAsync(
                        _dbContext,
                        new ActivityDescriptionContext(
                            log.ActionCode,
                            log.ModuleCode,
                            log.TargetType,
                            log.TargetId,
                            log.StatusCode,
                            log.SocieteId,
                            null),
                        cancellationToken);
                }

                items.Add(new
                {
                    id = log.Id,
                    createdAt = log.CreatedAt,
                    userId = log.UserId,
                    userName = log.UserFullName,
                    userEmail = log.UserEmail,
                    userRole = log.UserRole,
                    moduleCode = log.ModuleCode,
                    actionCode = log.ActionCode,
                    targetType = log.TargetType,
                    targetId = log.TargetId,
                    statusCode = log.StatusCode,
                    description = normalizedDescription,
                    path = log.Path,
                    method = log.HttpMethod,
                    ipAddress = log.IpAddress
                });
            }

            var moduleOptions = await ApplyTraceVisibilityFilters(
                    _dbContext.UserActivityLogs.AsNoTracking(),
                    CurrentSocieteId.Value)
                .Select(log => log.ModuleCode)
                .Distinct()
                .OrderBy(code => code)
                .ToListAsync(cancellationToken);

            var actionOptions = await ApplyTraceVisibilityFilters(
                    _dbContext.UserActivityLogs.AsNoTracking(),
                    CurrentSocieteId.Value)
                .Select(log => log.ActionCode)
                .Distinct()
                .OrderBy(code => code)
                .ToListAsync(cancellationToken);

            return Ok(new
            {
                page,
                pageSize,
                total,
                items,
                moduleOptions,
                actionOptions
            });
        }

        [HttpGet("export")]
        [RequirePermission("tracabilite", "export")]
        public async Task<IActionResult> ExportLogs([FromQuery] TracabiliteQuery query, CancellationToken cancellationToken)
        {
            if (!CurrentSocieteId.HasValue)
            {
                return Forbid();
            }

            var rows = await BuildFilteredQuery(CurrentSocieteId.Value, query)
                .OrderByDescending(log => log.CreatedAt)
                .Take(5000)
                .ToListAsync(cancellationToken);

            var sb = new StringBuilder();
            sb.AppendLine("DateUTC,Utilisateur,Email,Role,Module,Action,Cible,Statut,Description,Route,IP");

            foreach (var log in rows)
            {
                var target = string.IsNullOrWhiteSpace(log.TargetType)
                    ? "-"
                    : string.IsNullOrWhiteSpace(log.TargetId)
                        ? log.TargetType
                        : $"{log.TargetType}:{log.TargetId}";

                sb.AppendLine(string.Join(",",
                    EscapeCsv(log.CreatedAt.ToString("O")),
                    EscapeCsv(log.UserFullName),
                    EscapeCsv(log.UserEmail),
                    EscapeCsv(log.UserRole),
                    EscapeCsv(log.ModuleCode),
                    EscapeCsv(log.ActionCode),
                    EscapeCsv(target),
                    EscapeCsv(log.StatusCode.ToString()),
                    EscapeCsv(log.Description ?? string.Empty),
                    EscapeCsv($"{log.HttpMethod} {log.Path}"),
                    EscapeCsv(log.IpAddress ?? string.Empty)));
            }

            var fileName = $"tracabilite_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv; charset=utf-8", fileName);
        }

        private IQueryable<backend.Domain.Entities.UserActivityLog> BuildFilteredQuery(int societeId, TracabiliteQuery query)
        {
            var q = _dbContext.UserActivityLogs
                .AsNoTracking();

            q = ApplyTraceVisibilityFilters(q, societeId);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var pattern = $"%{query.Search.Trim()}%";
                q = q.Where(log =>
                    EF.Functions.Like(log.UserFullName, pattern)
                    || EF.Functions.Like(log.UserEmail, pattern)
                    || EF.Functions.Like(log.UserRole, pattern)
                    || EF.Functions.Like(log.Path, pattern)
                    || EF.Functions.Like(log.Description ?? string.Empty, pattern)
                    || EF.Functions.Like(log.TargetType ?? string.Empty, pattern)
                    || EF.Functions.Like(log.TargetId ?? string.Empty, pattern));
            }

            if (!string.IsNullOrWhiteSpace(query.Module))
            {
                var module = PermissionCatalog.CanonicalizeModule(query.Module);
                if (!string.IsNullOrWhiteSpace(module))
                {
                    q = q.Where(log => log.ModuleCode == module);
                }
            }

            if (!string.IsNullOrWhiteSpace(query.Action))
            {
                var action = PermissionCatalog.Actions.Canonicalize(query.Action);
                if (!string.IsNullOrWhiteSpace(action))
                {
                    q = q.Where(log => log.ActionCode == action);
                }
            }

            if (query.From.HasValue)
            {
                var fromUtc = query.From.Value.ToUniversalTime();
                q = q.Where(log => log.CreatedAt >= fromUtc);
            }

            if (query.To.HasValue)
            {
                var toUtc = query.To.Value.ToUniversalTime();
                q = q.Where(log => log.CreatedAt <= toUtc);
            }

            return q;
        }

        private static IQueryable<backend.Domain.Entities.UserActivityLog> ApplyTraceVisibilityFilters(
            IQueryable<backend.Domain.Entities.UserActivityLog> query,
            int societeId)
        {
            return query.Where(log =>
                log.SocieteId == societeId
                && log.ActionCode != PermissionCatalog.Actions.Read
                && log.ModuleCode != "dashboard"
                && !ExcludedSuperAdminRoleLabels.Contains(log.UserRole));
        }

        private static string EscapeCsv(string value)
        {
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
            {
                return $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
            }

            return value;
        }
    }

    public sealed class TracabiliteQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public string? Module { get; set; }
        public string? Action { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }
}
