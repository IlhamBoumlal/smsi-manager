using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Permissions.Commands.AssignPermission
{
    public class GrantPermissionCommand : IRequest<GrantPermissionResult>
    {
        public string RoleId { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
        public string ActionId { get; set; } = string.Empty;
    }

    public class GrantPermissionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? PermissionId { get; set; }
    }
}
