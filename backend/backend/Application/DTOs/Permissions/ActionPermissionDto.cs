namespace backend.Application.DTOs.Permissions
{
    public class ActionPermissionDto
    {
        public string ActionId { get; set; } = string.Empty;
        public string ActionCode { get; set; } = string.Empty;  
        public string ActionName { get; set; } = string.Empty;
        public bool IsGranted { get; set; }

    }
}
