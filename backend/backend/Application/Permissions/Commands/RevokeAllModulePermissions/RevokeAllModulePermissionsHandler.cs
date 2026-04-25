using backend.Application.Permissions.Queries.GetRolePermissionsWithModules;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Permissions.Commands.RevokeAllModulePermissions
{
    public class RevokeAllModulePermissionsHandler : IRequestHandler<RevokeAllModulePermissionsCommand, RevokeAllModulePermissionsResult>
    {
        private readonly IMediator _mediator;
        private readonly IPermissionRepository _permissionRepository;

        public RevokeAllModulePermissionsHandler(IMediator mediator, IPermissionRepository permissionRepository)
        {
            _mediator = mediator;
            _permissionRepository = permissionRepository;
        }

        public async Task<RevokeAllModulePermissionsResult> Handle(RevokeAllModulePermissionsCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Récupérer toutes les permissions du rôle pour ce module
                var permissions = await _mediator.Send(new GetRolePermissionsQuery { RoleId = request.RoleId }, cancellationToken);
                var modulePermissions = permissions.FirstOrDefault(m => m.ModuleId == request.ModuleId);

                if (modulePermissions == null || !modulePermissions.Permissions.Any(p => p.IsGranted))
                {
                    return new RevokeAllModulePermissionsResult
                    {
                        Success = false,
                        Message = "Aucune permission trouvée pour ce module",
                        DeletedCount = 0
                    };
                }

                // Récupérer toutes les actions accordées pour ce module
                var grantedActions = modulePermissions.Permissions
                    .Where(p => p.IsGranted)
                    .Select(p => p.ActionId)
                    .ToList();

                if (grantedActions.Count == 0)
                {
                    return new RevokeAllModulePermissionsResult
                    {
                        Success = false,
                        Message = "Aucune permission active trouvée pour ce module",
                        DeletedCount = 0
                    };
                }

                // Supprimer toutes les permissions en une seule opération (plus performant)
                var deletedCount = await _permissionRepository.RevokeAllModulePermissionsAsync(
                    request.RoleId,
                    request.ModuleId,
                    cancellationToken);

                if (deletedCount == 0)
                {
                    return new RevokeAllModulePermissionsResult
                    {
                        Success = false,
                        Message = "Erreur lors de la suppression des permissions",
                        DeletedCount = 0
                    };
                }

                return new RevokeAllModulePermissionsResult
                {
                    Success = true,
                    Message = $"Toutes les permissions du module ont été supprimées ({deletedCount} permission(s))",
                    DeletedCount = deletedCount
                };
            }
            catch (Exception ex)
            {
                return new RevokeAllModulePermissionsResult
                {
                    Success = false,
                    Message = $"Erreur: {ex.Message}",
                    DeletedCount = 0
                };
            }
        }
    }
}
