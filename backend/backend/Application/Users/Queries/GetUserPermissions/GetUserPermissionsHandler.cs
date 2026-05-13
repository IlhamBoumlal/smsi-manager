using backend.Application.DTOs.User;
using backend.Application.Security;
using MediatR;

namespace backend.Application.Users.Queries.GetUserPermissions
{
    public class GetUserPermissionsHandler : IRequestHandler<GetUserPermissionsQuery, UserPermissionsDto>
    {
        private readonly IUserPermissionService _permissionService;

        public GetUserPermissionsHandler(IUserPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        public Task<UserPermissionsDto> Handle(GetUserPermissionsQuery request, CancellationToken cancellationToken)
        {
            return _permissionService.GetEffectivePermissionsAsync(request.UserId, cancellationToken);
        }
    }
}
