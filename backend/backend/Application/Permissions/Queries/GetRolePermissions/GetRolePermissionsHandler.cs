using backend.Application.DTOs.Permissions;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Permissions.Queries.GetRolePermissions
{
    public class GetRolePermissionsHandler : IRequestHandler<GetRolePermissionsQuery, List<RolePermissionsDto>>
    {
        private readonly AppDbContext _context;

        public GetRolePermissionsHandler(AppDbContext context)
        {
            _context = context;
        }
        public async Task<List<RolePermissionsDto>> Handle(GetRolePermissionsQuery request, CancellationToken cancellationToken)
        {
            var allModules = await _context.Modules.ToListAsync(cancellationToken);
            var allActions = await _context.Actions.ToListAsync(cancellationToken);
            var grantedPermissions = await _context.Permissions
                .Where(p => p.RoleId == request.RoleId)
                .ToListAsync(cancellationToken);

            var result = allModules.Select(module => new RolePermissionsDto
            {
                ModuleId = module.Id,
                ModuleCode = module.Code,  // ← DOIT être module.Code, PAS module.Id !
                ModuleName = module.Name,
                Permissions = allActions.Select(action => new ActionPermissionDto
                {
                    ActionId = action.Id,
                    ActionCode = action.Code,  // ← DOIT être action.Code
                    ActionName = action.Name,
                    IsGranted = grantedPermissions.Any(p => p.ModuleId == module.Id && p.ActionId == action.Id)
                }).ToList()
            }).ToList();

            return result;
        }
    }
}