using backend.Application.Security;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace backend.API.Middleware
{
    public sealed class UserActivityTraceMiddleware
    {
        private static readonly HashSet<string> IgnoredPathPrefixes = new(StringComparer.OrdinalIgnoreCase)
        {
            "/swagger",
            "/notificationHub"
        };

        private readonly RequestDelegate _next;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<UserActivityTraceMiddleware> _logger;

        public UserActivityTraceMiddleware(
            RequestDelegate next,
            IServiceScopeFactory scopeFactory,
            ILogger<UserActivityTraceMiddleware> logger)
        {
            _next = next;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            Exception? pipelineException = null;
            string? requestLabelHint = null;

            try
            {
                requestLabelHint = await TryExtractRequestLabelHintAsync(context);
                if (string.IsNullOrWhiteSpace(requestLabelHint))
                {
                    requestLabelHint = await TryResolvePreActionLabelHintAsync(context);
                }
                await _next(context);
            }
            catch (Exception ex)
            {
                pipelineException = ex;
                throw;
            }
            finally
            {
                try
                {
                    await PersistTraceAsync(context, pipelineException, requestLabelHint);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Echec d'enregistrement de la trace utilisateur.");
                }
            }
        }

        private async Task<string?> TryResolvePreActionLabelHintAsync(HttpContext context)
        {
            if (!ShouldTrack(context))
            {
                return null;
            }

            var user = context.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            var societeClaim = user.FindFirstValue("SocieteId");
            if (!int.TryParse(societeClaim, out var societeId) || societeId <= 0)
            {
                return null;
            }

            var moduleCode = ResolveModuleCode(context);
            var actionCode = ResolveActionCode(context, moduleCode);
            if (string.Equals(actionCode, PermissionCatalog.Actions.Read, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var (targetType, targetId) = ResolveTarget(context, moduleCode);
            if (string.IsNullOrWhiteSpace(targetId))
            {
                return null;
            }

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var label = await UserActivityDescriptionGenerator.ResolveTargetNameForTraceAsync(
                dbContext,
                new ActivityDescriptionContext(
                    actionCode,
                    moduleCode,
                    targetType,
                    targetId,
                    StatusCodes.Status200OK,
                    societeId,
                    null),
                context.RequestAborted);

            return Trim(label, 120);
        }

        private async Task PersistTraceAsync(HttpContext context, Exception? pipelineException, string? requestLabelHint)
        {
            if (!ShouldTrack(context))
            {
                return;
            }

            var user = context.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                return;
            }

            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return;
            }

            var societeClaim = user.FindFirstValue("SocieteId");
            if (!int.TryParse(societeClaim, out var societeId) || societeId <= 0)
            {
                return;
            }

            var userRole = user.FindFirstValue(ClaimTypes.Role)
                ?? user.FindFirstValue("role")
                ?? string.Empty;

            var moduleCode = ResolveModuleCode(context);
            var actionCode = ResolveActionCode(context, moduleCode);
            if (string.Equals(actionCode, PermissionCatalog.Actions.Read, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var (targetType, targetId) = ResolveTarget(context, moduleCode);
            var statusCode = context.Response?.StatusCode is > 0
                ? context.Response.StatusCode
                : (pipelineException is null ? StatusCodes.Status200OK : StatusCodes.Status500InternalServerError);

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var description = await UserActivityDescriptionGenerator.BuildAsync(
                dbContext,
                new ActivityDescriptionContext(
                    actionCode,
                    moduleCode,
                    targetType,
                    targetId,
                    statusCode,
                    societeId,
                    requestLabelHint),
                context.RequestAborted);

            var entry = new UserActivityLog
            {
                Id = Guid.NewGuid().ToString(),
                SocieteId = societeId,
                UserId = userId,
                UserFullName = (user.FindFirstValue("NomComplet") ?? user.Identity?.Name ?? string.Empty).Trim(),
                UserEmail = user.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                UserRole = AppRoles.ToDisplayRoleName(userRole),
                ModuleCode = moduleCode,
                ActionCode = actionCode,
                HttpMethod = (context.Request.Method ?? string.Empty).ToUpperInvariant(),
                Path = context.Request.Path.Value ?? string.Empty,
                QueryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
                TargetType = targetType,
                TargetId = targetId,
                StatusCode = statusCode,
                Description = description,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Trim(context.Request.Headers.UserAgent.ToString(), 512),
                CreatedAt = DateTime.UtcNow,
            };

            entry.UserFullName = Trim(entry.UserFullName, 200) ?? string.Empty;
            entry.UserEmail = Trim(entry.UserEmail, 256) ?? string.Empty;
            entry.UserRole = Trim(entry.UserRole, 100) ?? string.Empty;
            entry.ModuleCode = Trim(entry.ModuleCode, 64) ?? string.Empty;
            entry.ActionCode = Trim(entry.ActionCode, 32) ?? string.Empty;
            entry.HttpMethod = Trim(entry.HttpMethod, 12) ?? string.Empty;
            entry.Path = Trim(entry.Path, 512) ?? string.Empty;
            entry.QueryString = Trim(entry.QueryString, 1024);
            entry.TargetType = Trim(entry.TargetType, 128);
            entry.TargetId = Trim(entry.TargetId, 128);
            entry.Description = Trim(entry.Description, 1000);
            entry.IpAddress = Trim(entry.IpAddress, 64);

            dbContext.UserActivityLogs.Add(entry);
            await dbContext.SaveChangesAsync();
        }

        private static bool ShouldTrack(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            if (string.IsNullOrWhiteSpace(path))
            {
                return false;
            }

            foreach (var prefix in IgnoredPathPrefixes)
            {
                if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            return path.StartsWith("/api", StringComparison.OrdinalIgnoreCase);
        }

        private static string ResolveModuleCode(HttpContext context)
        {
            var segments = (context.Request.Path.Value ?? string.Empty)
                .Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (segments.Length < 2 || !string.Equals(segments[0], "api", StringComparison.OrdinalIgnoreCase))
            {
                return "api";
            }

            var raw = segments[1];
            var canonical = PermissionCatalog.CanonicalizeModule(raw);
            return string.IsNullOrWhiteSpace(canonical) ? raw.ToLowerInvariant() : canonical;
        }

        private static string ResolveActionCode(HttpContext context, string moduleCode)
        {
            var endpoint = context.GetEndpoint();
            if (endpoint is not null)
            {
                var explicitPermissions = endpoint.Metadata
                    .OfType<RequirePermissionAttribute>()
                    .Where(permission => !string.IsNullOrWhiteSpace(permission.ActionCode))
                    .Select(permission => new
                    {
                        ModuleCode = PermissionCatalog.CanonicalizeModule(permission.ModuleCode),
                        ActionCode = PermissionCatalog.Actions.Canonicalize(permission.ActionCode)
                    })
                    .Where(item => !string.IsNullOrWhiteSpace(item.ActionCode))
                    .ToList();

                var endpointAction = explicitPermissions
                    .LastOrDefault(item => string.Equals(item.ModuleCode, moduleCode, StringComparison.OrdinalIgnoreCase))
                    ?? explicitPermissions.LastOrDefault();

                if (endpointAction is not null)
                {
                    return endpointAction.ActionCode;
                }
            }

            return PermissionCatalog.Actions.Canonicalize(
                PermissionCatalog.Actions.FromHttpMethod(context.Request.Method));
        }

        private static (string? targetType, string? targetId) ResolveTarget(HttpContext context, string moduleCode)
        {
            var routeValues = context.Request.RouteValues;
            var apiSegments = (context.Request.Path.Value ?? string.Empty)
                .Split('/', StringSplitOptions.RemoveEmptyEntries);

            var targetType = ResolveTargetTypeFromPath(moduleCode, apiSegments);
            var targetId = ResolveTargetId(routeValues, targetType)
                ?? ResolveTargetIdFromLocationHeader(context.Response.Headers.Location.ToString());
            return (targetType, targetId);
        }

        private static string? ResolveTargetTypeFromPath(string moduleCode, string[] segments)
        {
            var normalized = moduleCode.Trim().ToLowerInvariant();
            var normalizedSegments = segments
                .Select(segment => segment.Trim().ToLowerInvariant())
                .Where(segment => !string.IsNullOrWhiteSpace(segment))
                .ToArray();

            var literalSegments = normalizedSegments
                .Where(segment => !LooksLikeIdentifier(segment))
                .ToArray();

            bool HasLiteral(string value) => literalSegments.Any(segment => string.Equals(segment, value, StringComparison.OrdinalIgnoreCase));

            return normalized switch
            {
                "pdca" when HasLiteral("cycles") => "pdca-cycle",
                "pdca" when HasLiteral("sections") => "pdca-section",
                "pdca" when HasLiteral("items") => "pdca-item",
                "pdca" => "pdca-item",

                "risques" when HasLiteral("studies") => "risk-study",
                "risques" when HasLiteral("owners") => "risk-owner",
                "risques" when HasLiteral("atelier") => "risk-workshop",
                "risques" => "risk-study",

                "cartographie" when HasLiteral("documents") => "process-document",
                "cartographie" when HasLiteral("processus") => "process",
                "cartographie" => "process",

                "documentation" when HasLiteral("new-version") => "document-version",
                "documentation" when HasLiteral("file") || HasLiteral("download") => "document-file",
                "documentation" => "document",

                "sensibilisation" when HasLiteral("participants") => "formation-participant",
                "sensibilisation" when HasLiteral("documents") => "formation-document",
                "sensibilisation" => "formation",

                "audit" when HasLiteral("ncs") => "audit-nc",
                "audit" when HasLiteral("simulations") => "audit-simulation",
                "audit" => "audit",

                "controles" => "controle",
                "clauses" => "clause",
                "actifs" => "asset",
                "incidents" => "incident",
                "users" => "user",
                "roles" => "role",
                "tracabilite" => "trace-log",
                _ => normalized
            };
        }

        private static string? ResolveTargetId(RouteValueDictionary routeValues, string? targetType)
        {
            string[] preferredKeys = targetType switch
            {
                "process-document" => ["documentId", "docId", "id", "processusId"],
                "formation-document" => ["docId", "documentId", "id"],
                "formation-participant" => ["pid", "participantId", "id"],
                "pdca-item" => ["id", "itemId", "sectionId", "cycleId"],
                "pdca-section" => ["id", "sectionId", "phaseId"],
                "pdca-cycle" => ["id", "cycleId"],
                "risk-study" => ["id", "studyId"],
                "risk-workshop" => ["atelierId", "id", "studyId"],
                "document" or "document-file" or "document-version" => ["id"],
                "process" => ["id", "processusId"],
                "audit-nc" => ["id"],
                "audit-simulation" => ["id"],
                "formation" => ["id"],
                "user" => ["id", "userId"],
                "role" => ["id", "roleId"],
                "asset" => ["id"],
                "incident" => ["id"],
                "controle" => ["id"],
                "clause" => ["id"],
                _ => ["id", "itemId", "sectionId", "cycleId", "studyId", "documentId", "processusId", "docId", "pid", "userId", "roleId", "moduleId", "societeId", "atelierId"]
            };

            foreach (var key in preferredKeys)
            {
                if (!routeValues.TryGetValue(key, out var rawValue))
                {
                    continue;
                }

                var value = rawValue?.ToString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            foreach (var routeEntry in routeValues)
            {
                if (!routeEntry.Key.EndsWith("id", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var value = routeEntry.Value?.ToString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return null;
        }

        private static bool LooksLikeIdentifier(string segment)
        {
            if (Guid.TryParse(segment, out _))
            {
                return true;
            }

            return int.TryParse(segment, out _);
        }

        private static string? ResolveTargetIdFromLocationHeader(string? locationHeader)
        {
            if (string.IsNullOrWhiteSpace(locationHeader))
            {
                return null;
            }

            var location = locationHeader.Trim();
            if (Uri.TryCreate(location, UriKind.Absolute, out var absoluteUri))
            {
                location = absoluteUri.AbsolutePath;
            }

            var segments = location
                .Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Reverse()
                .ToArray();

            foreach (var segment in segments)
            {
                if (LooksLikeIdentifier(segment))
                {
                    return segment;
                }
            }

            return null;
        }

        private static async Task<string?> TryExtractRequestLabelHintAsync(HttpContext context)
        {
            var method = context.Request.Method?.ToUpperInvariant();
            if (method is not ("POST" or "PUT" or "PATCH"))
            {
                return null;
            }

            var candidateKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "nom",
                "name",
                "title",
                "titre",
                "reference",
                "subject",
                "text",
                "label",
                "nomprocessus",
                "processname",
                "processusname",
                "documentname",
                "nomdocument"
            };

            if (context.Request.HasFormContentType)
            {
                var form = await context.Request.ReadFormAsync();
                foreach (var entry in form)
                {
                    var normalizedKey = NormalizeFieldKey(entry.Key);
                    if (!candidateKeys.Contains(normalizedKey))
                    {
                        continue;
                    }

                    var value = entry.Value.ToString();
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        return Trim(value, 120);
                    }
                }

                return null;
            }

            if (context.Request.ContentType is null
                || !context.Request.ContentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            context.Request.EnableBuffering();
            context.Request.Body.Position = 0;
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (string.IsNullOrWhiteSpace(body))
            {
                return null;
            }

            try
            {
                using var json = JsonDocument.Parse(body);
                if (json.RootElement.ValueKind != JsonValueKind.Object)
                {
                    return null;
                }

                var jsonLabel = TryFindLabelInJson(json.RootElement, candidateKeys);
                if (!string.IsNullOrWhiteSpace(jsonLabel))
                {
                    return Trim(jsonLabel, 120);
                }
            }
            catch
            {
                return null;
            }

            return null;
        }

        private static string? TryFindLabelInJson(JsonElement root, HashSet<string> candidateKeys)
        {
            if (root.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in root.EnumerateObject())
                {
                    if (property.Value.ValueKind is not JsonValueKind.String)
                    {
                        continue;
                    }

                    if (!candidateKeys.Contains(NormalizeFieldKey(property.Name)))
                    {
                        continue;
                    }

                    var value = property.Value.GetString();
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        return value;
                    }
                }

                foreach (var property in root.EnumerateObject())
                {
                    if (property.Value.ValueKind is not (JsonValueKind.Object or JsonValueKind.Array))
                    {
                        continue;
                    }

                    var nested = TryFindLabelInJson(property.Value, candidateKeys);
                    if (!string.IsNullOrWhiteSpace(nested))
                    {
                        return nested;
                    }
                }

                return null;
            }

            if (root.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in root.EnumerateArray())
                {
                    var nested = TryFindLabelInJson(item, candidateKeys);
                    if (!string.IsNullOrWhiteSpace(nested))
                    {
                        return nested;
                    }
                }
            }

            return null;
        }

        private static string NormalizeFieldKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            return value
                .Trim()
                .ToLowerInvariant()
                .Replace("-", string.Empty, StringComparison.Ordinal)
                .Replace("_", string.Empty, StringComparison.Ordinal)
                .Replace(" ", string.Empty, StringComparison.Ordinal);
        }

        private static string? Trim(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            var trimmed = value.Trim();
            return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
        }
    }
}
