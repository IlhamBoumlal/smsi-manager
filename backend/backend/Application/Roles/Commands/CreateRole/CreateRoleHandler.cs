using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Roles.Commands.CreateRole
{
    public class CreateRoleHandler : IRequestHandler<CreateRoleCommand, IdentityResult>
    {
        private readonly IRoleRepository _repo;

        public CreateRoleHandler(IRoleRepository repo) => _repo = repo;

        public async Task<IdentityResult> Handle(CreateRoleCommand request, CancellationToken ct)
            => await _repo.CreateAsync(request.RoleName);
    }
}
