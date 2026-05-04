using MediatR;

namespace backend.Application.Users.Commands.UpdateUser
{
    public record UpdateUserCommand(
        string UserId,
        string NomComplet,
        string Email,
        int? SocieteId,
        string RoleId,
        string? Password,
        string? ConfirmPassword,
        bool IsActive
    ) : IRequest<(bool Success, string? Error)>;
}
