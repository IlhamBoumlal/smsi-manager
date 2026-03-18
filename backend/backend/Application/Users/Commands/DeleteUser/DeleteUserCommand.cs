using MediatR;

namespace backend.Application.Users.Commands.DeleteUser
{
    public record DeleteUserCommand(string UserId) : IRequest<(bool Success, string? Error)>;

}
