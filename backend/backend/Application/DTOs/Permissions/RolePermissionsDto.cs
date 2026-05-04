namespace backend.Application.DTOs.Permissions
{
    // DTO retourné par GET /api/roles/{roleId}/permissions
    // Structure attendue par le frontend (un objet par module)
    public class RolePermissionsDto
    {
        public string ModuleId { get; set; } = string.Empty;
        public string ModuleCode { get; set; } = string.Empty;  
        public string ModuleName { get; set; } = string.Empty;
        public List<ActionPermissionDto> Permissions { get; set; } = new();
    }
}
