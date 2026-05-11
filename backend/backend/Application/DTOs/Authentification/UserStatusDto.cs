namespace backend.Application.DTOs.Authentification
{
    public class UserStatusDto
    {
        public bool IsActive { get; set; }
        public string Email { get; set; } = string.Empty;
    }
}
