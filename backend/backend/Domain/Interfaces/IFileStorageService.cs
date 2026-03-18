namespace backend.Domain.Interfaces
{
    public interface IFileStorageService
    {
        Task<string?> SaveLogoAsync(IFormFile? logo);
        void DeleteLogoFile(string? logoPath);
    }
}
