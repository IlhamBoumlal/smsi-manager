namespace backend.Application.DTOs.User
{
    public sealed record SetUserPermissionOverridesDto(
        List<UserPermissionOverrideItemDto> Overrides
    );

    public sealed record UserPermissionOverrideItemDto(
        string ModuleCode,
        string ActionCode,
        bool IsGranted,
        string? Reason = null
    );
}
