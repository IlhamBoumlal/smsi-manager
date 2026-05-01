using backend.Application.DTOs.User;
using MediatR;

namespace backend.Application.Users.Queries.GetUserPermissions
{
    public class GetUserPermissionsQuery : IRequest<UserPermissionsDto>
    {
        public string UserId { get; set; } = string.Empty;
    }
}
