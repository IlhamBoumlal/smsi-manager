// backend.Infrastructure/Repositories/PermissionRepository.cs
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories
{
    public class PermissionRepository : IPermissionRepository
    {
        private readonly AppDbContext _context;

        public PermissionRepository(AppDbContext context)
        {
            _context = context;
        }

        // Supprime toutes les permissions d'un module pour un rôle spécifique
        public async Task<int> RevokeAllModulePermissionsAsync(string roleId, string moduleId, CancellationToken cancellationToken = default)
        {
            return await _context.Permissions
                .Where(p => p.RoleId == roleId && p.ModuleId == moduleId)
                .ExecuteDeleteAsync(cancellationToken);
        }

        // Supprime une permission spécifique
        public async Task<bool> RevokePermissionAsync(string roleId, string moduleId, string actionId, CancellationToken cancellationToken = default)
        {
            var deleted = await _context.Permissions
                .Where(p => p.RoleId == roleId && p.ModuleId == moduleId && p.ActionId == actionId)
                .ExecuteDeleteAsync(cancellationToken);

            return deleted > 0;
        }

        // Ajoute une nouvelle permission
        public async Task<bool> GrantPermissionAsync(string roleId, string moduleId, string actionId, CancellationToken cancellationToken = default)
        {
            var permission = new Permission
            {
                Id = Guid.NewGuid().ToString(),
                RoleId = roleId,
                ModuleId = moduleId,
                ActionId = actionId
            };

            await _context.Permissions.AddAsync(permission, cancellationToken);
            var result = await _context.SaveChangesAsync(cancellationToken);
            return result > 0;
        }
    }
}
