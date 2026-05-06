using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Commands.UpdateRole
{
    public class UpdateRoleCommand : IRequest<IdentityResult>
    {
        public string RoleId { get; set; } = string.Empty;
        public string NewRoleName { get; set; } = string.Empty;
    }
}
