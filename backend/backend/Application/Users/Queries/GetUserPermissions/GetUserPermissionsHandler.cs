// backend.Application/Users/Queries/GetUserPermissions/GetUserPermissionsHandler.cs
using backend.Application.DTOs.User;
using backend.Application.Permissions.Queries.GetRolePermissions;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Users.Queries.GetUserPermissions
{
    public class GetUserPermissionsHandler : IRequestHandler<GetUserPermissionsQuery, UserPermissionsDto>
    {
        private readonly IMediator _mediator;
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;

        public GetUserPermissionsHandler(IMediator mediator, IUserRepository userRepository, IRoleRepository roleRepository)
        {
            _mediator = mediator;
            _userRepository = userRepository;
            _roleRepository = roleRepository;
        }

        public async Task<UserPermissionsDto> Handle(GetUserPermissionsQuery request, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
            if (user == null) throw new Exception("Utilisateur non trouvé");

            var roleId = await _userRepository.GetRoleIdByUserIdAsync(request.UserId, cancellationToken);
            if (string.IsNullOrEmpty(roleId)) throw new Exception("Rôle non trouvé");

            var role = await _roleRepository.GetByIdAsync(roleId);
            var permissions = await _mediator.Send(new GetRolePermissionsQuery { RoleId = roleId }, cancellationToken);

            return new UserPermissionsDto
            {
                UserId = user.Id,
                RoleId = roleId,
                RoleName = role?.Name ?? "",
                Modules = permissions.Select(m => new ModulePermissionDto
                {
                    ModuleId = m.ModuleId,
                    ModuleCode = m.ModuleCode,  // ← DOIT être m.ModuleCode
                    ModuleName = m.ModuleName,
                    Actions = m.Permissions
                        .Where(p => p.IsGranted)
                        .Select(p => new ActionPermissionDto
                        {
                            ActionId = p.ActionId,
                            ActionCode = p.ActionCode,  // ← DOIT être p.ActionCode
                            ActionName = p.ActionName
                        }).ToList()
                }).ToList()
            };
        }
        // Méthode temporaire pour récupérer le code du module
        private string GetModuleCodeFromId(string moduleId)
        {
            // Tu peux return le moduleId ou implémenter une vraie logique
            return moduleId;
        }

        // Méthode temporaire pour récupérer le code de l'action
        private string GetActionCodeFromId(string actionId)
        {
            // Mapping des IDs d'action vers leurs codes
            var actionMapping = new Dictionary<string, string>
            {
                { "d1af9a49-4175-4687-909b-2068bf445c41", "view" },
                { "179d51d3-11f6-4e04-bbad-d1d7676bb974", "create" },
                { "451ccf54-cc0e-4ec8-8fa1-8030f676977d", "edit" },
                { "b13bbed6-741f-4957-8982-4ded0f4f6a88", "delete" },
                { "65627126-2228-4129-8ada-52185cdbb1b6", "export" }
            };

            return actionMapping.ContainsKey(actionId) ? actionMapping[actionId] : actionId;
        }
    }
}