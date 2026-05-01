namespace backend.Application.DTOs.User
{
    public class UserPermissionsDto
    {
        public string UserId { get; set; } = string.Empty;
        public string RoleId { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public List<ModulePermissionDto> Modules { get; set; } = new();
    }

    public class ModulePermissionDto
    {
        public string ModuleId { get; set; } = string.Empty;
        public string ModuleCode { get; set; } = string.Empty;
        public string ModuleName { get; set; } = string.Empty;
        public List<ActionPermissionDto> Actions { get; set; } = new();
    }

    public class ActionPermissionDto
    {
        public string ActionId { get; set; } = string.Empty;
        public string ActionCode { get; set; } = string.Empty;
        public string ActionName { get; set; } = string.Empty;
    }
}
