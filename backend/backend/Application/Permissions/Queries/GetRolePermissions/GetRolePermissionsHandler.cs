using backend.Application.DTOs.Permissions;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Permissions.Queries.GetRolePermissionsWithModules
{
    public class GetRolePermissionsHandler : IRequestHandler<GetRolePermissionsQuery, List<RolePermissionsDto>>
    {
        private readonly AppDbContext _context;

        public GetRolePermissionsHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<RolePermissionsDto>> Handle(
            GetRolePermissionsQuery request,
            CancellationToken cancellationToken)
        {
            // Charger uniquement les permissions accordées pour ce rôle,
            // avec les données du module et de l'action
            var grantedPermissions = await _context.Permissions
                .Where(p => p.RoleId == request.RoleId)
                .Include(p => p.Module)
                .Include(p => p.Action)
                .ToListAsync(cancellationToken);

            // Si aucune permission → retourner liste vide
            // (le frontend affichera l'état vide avec le bouton "Ajouter des permissions")
            if (!grantedPermissions.Any())
                return new List<RolePermissionsDto>();

            // Grouper par module et construire le DTO
            // Chaque entrée = un module avec ses actions accordées (isGranted toujours true ici)
            var result = grantedPermissions
                .GroupBy(p => new { p.ModuleId, p.Module.Name })
                .Select(g => new RolePermissionsDto
                {
                    ModuleId = g.Key.ModuleId,
                    ModuleName = g.Key.Name,
                    Permissions = g.Select(p => new ActionPermissionDto
                    {
                        ActionId = p.ActionId,
                        ActionName = p.Action.Name,
                        IsGranted = true   // toujours true : on ne retourne que ce qui est accordé
                    }).ToList()
                })
                .OrderBy(m => m.ModuleName)
                .ToList();

            return result;
        }
    }

}
