using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Application.Security;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Permissions.Commands.AssignPermission
{
    public class GrantPermissionHandler : IRequestHandler<GrantPermissionCommand, GrantPermissionResult>
    {
        private readonly AppDbContext _context;

        public GrantPermissionHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GrantPermissionResult> Handle(
            GrantPermissionCommand request,
            CancellationToken cancellationToken)
        {
            // Vérifier que le rôle existe dans AspNetRoles
            var roleExists = await _context.Roles
                .AnyAsync(r => r.Id == request.RoleId, cancellationToken);

            if (!roleExists)
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = $"Le rôle '{request.RoleId}' n'existe pas."
                };

            // Vérifier que le module existe
            var module = await _context.Modules
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == request.ModuleId, cancellationToken);

            if (module is null)
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = $"Le module '{request.ModuleId}' n'existe pas."
                };

            // Vérifier que l'action existe
            var action = await _context.Actions
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == request.ActionId, cancellationToken);

            if (action is null)
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = $"L'action '{request.ActionId}' n'existe pas."
                };

            var moduleCode = PermissionCatalog.CanonicalizeModule(module.Code);
            var actionCode = PermissionCatalog.Actions.Canonicalize(action.Code);

            if (string.Equals(moduleCode, "dashboard", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(actionCode, PermissionCatalog.Actions.Read, StringComparison.OrdinalIgnoreCase))
            {
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = "Le module dashboard accepte uniquement l'action de lecture."
                };
            }

            if (string.Equals(moduleCode, "chatbot", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(actionCode, PermissionCatalog.Actions.Use, StringComparison.OrdinalIgnoreCase))
            {
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = "Le module chatbot accepte uniquement l'action d'utilisation."
                };
            }

            if (!string.Equals(moduleCode, "chatbot", StringComparison.OrdinalIgnoreCase)
                && string.Equals(actionCode, PermissionCatalog.Actions.Use, StringComparison.OrdinalIgnoreCase))
            {
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = "L'action d'utilisation est reservee au module chatbot."
                };
            }

            // Vérifier si la permission existe déjà (idempotent)
            var existing = await _context.Permissions
                .FirstOrDefaultAsync(p =>
                    p.RoleId == request.RoleId &&
                    p.ModuleId == request.ModuleId &&
                    p.ActionId == request.ActionId,
                    cancellationToken);

            if (existing != null)
                return new GrantPermissionResult
                {
                    Success = true,
                    Message = "Permission déjà accordée.",
                    PermissionId = existing.Id
                };

            // Créer la permission
            var permission = new Permission
            {
                RoleId = request.RoleId,
                ModuleId = request.ModuleId,
                ActionId = request.ActionId
            };

            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync(cancellationToken);

            return new GrantPermissionResult
            {
                Success = true,
                Message = "Permission accordée avec succès.",
                PermissionId = permission.Id
            };
        }
    }
}
