using backend.Application.DTOs.Permissions;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace backend.Domain.Interfaces
{
    public interface IPermissionRepository
    {

        Task<int> RevokeAllModulePermissionsAsync(string roleId, string moduleId, CancellationToken cancellationToken = default);

        Task<bool> RevokePermissionAsync(string roleId, string moduleId, string actionId, CancellationToken cancellationToken = default);
        Task<bool> GrantPermissionAsync(string roleId, string moduleId, string actionId, CancellationToken cancellationToken = default);
    }
}
