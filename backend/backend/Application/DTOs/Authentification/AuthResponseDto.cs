namespace backend.Application.DTOs.Authentification
{
    public record AuthResponseDto(
        string Token,
        string NomComplet,
        string Email,
        SocieteInfoDto? Societe
    );
}
