using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Permissions.Commands.RemovePermission
{
    public class RevokePermissionHandler : IRequestHandler<RevokePermissionCommand, RevokePermissionResult>
    {
        private readonly AppDbContext _context;

        public RevokePermissionHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RevokePermissionResult> Handle(
            RevokePermissionCommand request,
            CancellationToken cancellationToken)
        {
            var permission = await _context.Permissions
                .FirstOrDefaultAsync(p =>
                    p.RoleId == request.RoleId &&
                    p.ModuleId == request.ModuleId &&
                    p.ActionId == request.ActionId,
                    cancellationToken);

            if (permission == null)
                return new RevokePermissionResult
                {
                    Success = false,
                    Message = "Permission introuvable."
                };

            _context.Permissions.Remove(permission);
            await _context.SaveChangesAsync(cancellationToken);

            return new RevokePermissionResult
            {
                Success = true,
                Message = "Permission révoquée avec succès."
            };
        }
    }
}
