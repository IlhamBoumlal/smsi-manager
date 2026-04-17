namespace backend.Application.DTOs.Documentation
{
    public record DocumentationPermissionsDto(
        string Role,
        bool CanConsult,
        bool CanCreate,
        bool CanEditOwn,
        bool CanEditAny,
        bool CanDelete,
        bool CanApprove,
        bool CanCreateVersion,
        IReadOnlyList<string> AllowedCategories
    );
}
