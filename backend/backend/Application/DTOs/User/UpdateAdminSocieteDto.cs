namespace backend.Application.DTOs.User
{
    public record UpdateAdminSocieteDto(
        string NomComplet,
        string Email,
        int SocieteId,
        string? Password,
        string? ConfirmPassword,
        bool IsActive
    );
}

