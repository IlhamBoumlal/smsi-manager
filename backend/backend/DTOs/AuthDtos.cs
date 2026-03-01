namespace backend.DTOs
{
    public record RegisterDto(
            string NomComplet,
            string Email,
            int? HoldingId,
            int SocieteId,
            string Password,
            string ConfirmPassword
        );

    public record LoginDto(string Email, string Password);

    public record AuthResponseDto(string Token, string NomComplet, string Email);

    public record HoldingDto(int Id, string Nom);

    public record SocieteDto(int Id, string Nom, int? HoldingId);
}
