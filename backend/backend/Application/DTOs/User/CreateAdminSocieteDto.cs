namespace backend.Application.DTOs.User
{
    public record CreateAdminSocieteDto(
        string NomComplet,
        string Email,
        int SocieteId,
        string Password,
        string ConfirmPassword
    );
}

