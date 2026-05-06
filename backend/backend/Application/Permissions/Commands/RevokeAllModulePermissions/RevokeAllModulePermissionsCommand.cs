using MediatR;

namespace backend.Application.Permissions.Commands.RevokeAllModulePermissions
{
    public class RevokeAllModulePermissionsCommand : IRequest<RevokeAllModulePermissionsResult>
    {
        public string RoleId { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
    }

    public class RevokeAllModulePermissionsResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int DeletedCount { get; set; }
        public List<PermissionError> Errors { get; set; } = new();
    }
    public class PermissionError
    {
        public string ActionId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
