<<<<<<< HEAD
namespace backend.Domain.Interfaces
=======
﻿namespace backend.Domain.Interfaces
>>>>>>> meriem
{
    public interface IFileStorageService
    {
        Task<string?> SaveLogoAsync(IFormFile? logo);
        void DeleteLogoFile(string? logoPath);
<<<<<<< HEAD
        Task<string?> SaveDocumentAsync(IFormFile? file);
        void DeleteDocumentFile(string? documentPath);
=======
>>>>>>> meriem
    }
}
