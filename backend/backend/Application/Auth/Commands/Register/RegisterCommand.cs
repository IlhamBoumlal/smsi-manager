using backend.Application.DTOs.Authentification;
using MediatR;

namespace backend.Application.Auth.Commands.Register
{
    public record RegisterCommand(
    string NomComplet,
    string Email,
    string Password,
    string ConfirmPassword,
    int SocieteId,
    string RoleId
) : IRequest<(bool Success, string? Error, AuthResponseDto? Data)>;
}
