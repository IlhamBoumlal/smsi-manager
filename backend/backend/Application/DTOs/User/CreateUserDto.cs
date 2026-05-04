namespace backend.Application.DTOs.User
{
    public record CreateUserDto(
        string NomComplet,
        string Email,
        string Password,
        string ConfirmPassword,
        int? SocieteId,
        string RoleId
    );
}
