using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Commands.DeleteRole
{
    public class DeleteRoleHandler : IRequestHandler<DeleteRoleCommand, IdentityResult>
    {
        private readonly IRoleRepository _repo;

        public DeleteRoleHandler(IRoleRepository repo) => _repo = repo;

        public async Task<IdentityResult> Handle(DeleteRoleCommand request, CancellationToken ct)
            => await _repo.DeleteAsync(request.RoleId);
    }
}
