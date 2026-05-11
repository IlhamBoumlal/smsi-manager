using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Commands.DeleteRole
{
    public class DeleteRoleCommand : IRequest<IdentityResult>
    {
        public string RoleId { get; set; } = string.Empty;
    }
}
