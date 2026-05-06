using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Commands.CreateRole
{
    public class CreateRoleCommand : IRequest<IdentityResult>
    {
        public string RoleName { get; set; } = string.Empty;
    }
}
