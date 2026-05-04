using backend.Application.DTOs.Documentation;
using backend.Domain.Entities;

namespace backend.Application.Documentation
{
    internal static class DocumentationHelpers
    {
        internal static readonly string[] AllowedExtensions =
        [
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".ppt", ".pptx", ".txt", ".csv",
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
            ".zip", ".rar", ".7z"
        ];
        internal const long MaxFileSizeBytes = 20 * 1024 * 1024;

        internal static string NormalizeStatus(string? status)
        {
            var value = status?.Trim().ToLowerInvariant();
            return value switch
            {
                "approuve" => "approuve",
                "en-validation" => "en-validation",
                "brouillon" => "brouillon",
                "a-revoir" => "a-revoir",
                _ => "brouillon"
            };
        }

        internal static bool IsAllowedFile(IFormFile? file)
        {
            if (file is null) return true;
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return AllowedExtensions.Contains(extension) && file.Length <= MaxFileSizeBytes;
        }

        internal static DocumentationResponseDto ToDto(
            DocumentationDocument d,
            bool canEdit = false,
            bool canDelete = false,
            bool canApprove = false,
            bool canCreateVersion = false,
            bool isOwnDocument = false) =>
            new(
                d.Id,
                d.Name,
                d.Type,
                d.Category,
                d.Status,
                d.Version,
                d.Classification,
                d.Author,
                d.Approver,
                d.Clause,
                d.Controle,
                d.Description,
                d.FilePath,
                d.OriginalFileName,
                d.FileSizeBytes,
                d.CreatedAt,
                d.UpdatedAt,
                canEdit,
                canDelete,
                canApprove,
                canCreateVersion,
                isOwnDocument
            );
    }
}
