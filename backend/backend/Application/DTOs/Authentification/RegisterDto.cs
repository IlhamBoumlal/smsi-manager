namespace backend.Application.DTOs.Authentification
{
    public record RegisterDto(
            string NomComplet,
            string Email,
            int? SocieteId,
            string RoleId,
            string Password,
            string ConfirmPassword
        );
}
