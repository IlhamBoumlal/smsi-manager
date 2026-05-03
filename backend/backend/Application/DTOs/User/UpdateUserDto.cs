namespace backend.Application.DTOs.User
{
    public record UpdateUserDto(
        string NomComplet,
        string Email,
        int? SocieteId,
        string RoleId,
        string? Password,
        string? ConfirmPassword,
        bool IsActive
    );
}
