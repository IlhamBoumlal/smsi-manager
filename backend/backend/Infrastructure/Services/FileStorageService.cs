using backend.Domain.Interfaces;

namespace backend.Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        public async Task<string?> SaveLogoAsync(IFormFile? logo)
        {
            if (logo == null) return null;

            var uploadsDir = Path.Combine("wwwroot", "logos");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(logo.FileName)}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await logo.CopyToAsync(stream);

            return $"/logos/{fileName}";
        }

        public void DeleteLogoFile(string? logoPath)
        {
            if (string.IsNullOrEmpty(logoPath)) return;
            var oldPath = Path.Combine("wwwroot", logoPath.TrimStart('/'));
            if (File.Exists(oldPath)) File.Delete(oldPath);
        }
    }
}
