using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Commands.UpdateRole
{
    public class UpdateRoleHandler : IRequestHandler<UpdateRoleCommand, IdentityResult>
    {
        private readonly IRoleRepository _repo;

        public UpdateRoleHandler(IRoleRepository repo) => _repo = repo;

        public async Task<IdentityResult> Handle(UpdateRoleCommand request, CancellationToken ct)
            => await _repo.UpdateAsync(request.RoleId, request.NewRoleName);
    }
}
