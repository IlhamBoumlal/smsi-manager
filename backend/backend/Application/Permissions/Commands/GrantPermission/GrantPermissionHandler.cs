using backend.Domain.Entities;
using backend.Domain.Interfaces;
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
            var moduleExists = await _context.Modules
                .AnyAsync(m => m.Id == request.ModuleId, cancellationToken);

            if (!moduleExists)
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = $"Le module '{request.ModuleId}' n'existe pas."
                };

            // Vérifier que l'action existe
            var actionExists = await _context.Actions
                .AnyAsync(a => a.Id == request.ActionId, cancellationToken);

            if (!actionExists)
                return new GrantPermissionResult
                {
                    Success = false,
                    Message = $"L'action '{request.ActionId}' n'existe pas."
                };

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
