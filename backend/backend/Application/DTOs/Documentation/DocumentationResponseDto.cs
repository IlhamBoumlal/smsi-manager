namespace backend.Application.DTOs.Documentation
{
    public record DocumentationResponseDto(
        Guid Id,
        string Name,
        string Type,
        string Category,
        string Status,
        string Version,
        string Classification,
        string Author,
        string? Approver,
        string? Clause,
        string? Controle,
        string? Description,
        string? FilePath,
        string? OriginalFileName,
        long? FileSizeBytes,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        bool CanEdit,
        bool CanDelete,
        bool CanApprove,
        bool CanCreateVersion,
        bool IsOwnDocument
    );
}
