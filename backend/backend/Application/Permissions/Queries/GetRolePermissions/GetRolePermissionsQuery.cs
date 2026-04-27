using backend.Application.DTOs.Permissions;
using MediatR;

namespace backend.Application.Permissions.Queries.GetRolePermissions
{
    public class GetRolePermissionsQuery : IRequest<List<RolePermissionsDto>>
    {
        public string RoleId { get; set; } = string.Empty;
    }
}
