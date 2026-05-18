using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Application.Security
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public RequirePermissionAttribute(string moduleCode, string? actionCode = null)
        {
            ModuleCode = moduleCode;
            ActionCode = actionCode;
        }

        public string ModuleCode { get; }
        public string? ActionCode { get; }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (context.HttpContext.GetEndpoint()?.Metadata?.GetMetadata<IAllowAnonymous>() != null)
            {
                return;
            }

            if (ShouldSkipBecauseMethodOverrides(context))
            {
                return;
            }

            var user = context.HttpContext.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                context.Result = new ForbidResult();
                return;
            }

            var societeClaim = user.FindFirstValue("SocieteId");
            var societeId = int.TryParse(societeClaim, out var parsedSocieteId) ? parsedSocieteId : (int?)null;

            var requestedAction = PermissionCatalog.Actions.Canonicalize(
                ActionCode ?? PermissionCatalog.Actions.FromHttpMethod(context.HttpContext.Request.Method));

            var permissionService = context.HttpContext.RequestServices.GetRequiredService<IUserPermissionService>();
            var isAllowed = await permissionService.HasPermissionAsync(
                userId,
                societeId,
                ModuleCode,
                requestedAction,
                context.HttpContext.RequestAborted);

            if (isAllowed)
            {
                return;
            }

            context.Result = new ObjectResult(new
            {
                message = "Action non autorisee pour votre role/perimetre.",
                module = PermissionCatalog.CanonicalizeModule(ModuleCode),
                action = requestedAction,
                code = "RBAC_PERMISSION_DENIED"
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }

        private bool ShouldSkipBecauseMethodOverrides(AuthorizationFilterContext context)
        {
            if (!string.IsNullOrWhiteSpace(ActionCode))
            {
                return false;
            }

            var module = PermissionCatalog.CanonicalizeModule(ModuleCode);
            if (string.IsNullOrWhiteSpace(module))
            {
                return false;
            }

            var endpointPermissions = context.ActionDescriptor.EndpointMetadata
                .OfType<RequirePermissionAttribute>()
                .ToArray();

            if (endpointPermissions.Length <= 1)
            {
                return false;
            }

            return endpointPermissions.Any(p =>
                !ReferenceEquals(p, this)
                && !string.IsNullOrWhiteSpace(p.ActionCode)
                && string.Equals(
                    PermissionCatalog.CanonicalizeModule(p.ModuleCode),
                    module,
                    StringComparison.OrdinalIgnoreCase));
        }
    }
}
