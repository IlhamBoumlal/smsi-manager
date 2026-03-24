using backend.Application.DTOs.Authentification;
using MediatR;

namespace backend.Application.Auth.Commands.Login
{
    public record LoginCommand(
    string Email,
    string Password
) : IRequest<(bool Success, string? Error, AuthResponseDto? Data)>;
}
