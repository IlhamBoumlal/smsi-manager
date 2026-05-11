using backend.Application.DTOs.Authentification;
using MediatR;

namespace backend.Application.Auth.Queries
{
    public record CheckUserStatusQuery(string UserId) : IRequest<UserStatusDto>;
}
