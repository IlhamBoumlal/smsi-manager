using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Queries.GetAllRoles
{
    public record GetAllRolesQuery() : IRequest<List<IdentityRole>>;
}
