using backend.Application.DTOs.User;

namespace backend.Application.Security
{
    public interface IUserPermissionService
    {
        Task<UserPermissionsDto> GetEffectivePermissionsAsync(string userId, CancellationToken cancellationToken = default);

        Task<bool> HasPermissionAsync(
            string userId,
            int? societeId,
            string moduleCode,
            string actionCode,
            CancellationToken cancellationToken = default);
    }
}
