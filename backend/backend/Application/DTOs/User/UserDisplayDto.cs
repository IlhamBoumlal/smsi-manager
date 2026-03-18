namespace backend.Application.DTOs.User
{
    public record UserDisplayDto(
    string Id,
    string NomComplet,
    string Email,
    string Societe,
    string Role,
    string DateCreation,
    string Statut,
    bool IsActive   
);
}
