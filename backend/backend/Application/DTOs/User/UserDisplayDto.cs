namespace backend.Application.DTOs.User
{
    public record UserDisplayDto(
        string Id,
        string NomComplet,
        string Email,
        int? SocieteId,
        string Societe,
        string Role,
        string DateCreation,
        string Statut,
        bool IsActive
    );
}
