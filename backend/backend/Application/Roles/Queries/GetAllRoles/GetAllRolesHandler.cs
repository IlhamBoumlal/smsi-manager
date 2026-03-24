using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Queries.GetAllRoles
{
    public class GetAllRolesHandler : IRequestHandler<GetAllRolesQuery, List<IdentityRole>>
    {
        private readonly IRoleRepository _repo;
        public GetAllRolesHandler(IRoleRepository repo) => _repo = repo;

        public async Task<List<IdentityRole>> Handle(GetAllRolesQuery request, CancellationToken ct)
            => await _repo.GetAllAsync();
    }
}
