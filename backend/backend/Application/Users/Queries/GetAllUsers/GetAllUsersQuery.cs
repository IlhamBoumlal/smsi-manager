using backend.Application.DTOs.User;
using MediatR;

namespace backend.Application.Users.Queries.GetAllUsers
{
    public record GetAllUsersQuery() : IRequest<List<UserDisplayDto>>;

}
