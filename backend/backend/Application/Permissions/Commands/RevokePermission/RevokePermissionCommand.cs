using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Permissions.Commands.RemovePermission
{
    public class RevokePermissionCommand : IRequest<RevokePermissionResult>
    {
        public string RoleId { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
        public string ActionId { get; set; } = string.Empty;
    }

    public class RevokePermissionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

}
