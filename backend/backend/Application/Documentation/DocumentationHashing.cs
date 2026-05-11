using System.Security.Cryptography;

namespace backend.Application.Documentation
{
    internal static class DocumentationHashing
    {
        internal static async Task<string?> ComputeSha256HexAsync(IFormFile? file, CancellationToken cancellationToken = default)
        {
            if (file is null || file.Length <= 0) return null;
            await using var stream = file.OpenReadStream();
            return await ComputeSha256HexAsync(stream, cancellationToken);
        }

        internal static async Task<string?> ComputeSha256HexAsync(Stream? stream, CancellationToken cancellationToken = default)
        {
            if (stream is null) return null;
            if (stream.CanSeek) stream.Position = 0;

            using var sha = SHA256.Create();
            var hashBytes = await sha.ComputeHashAsync(stream, cancellationToken);
            if (stream.CanSeek) stream.Position = 0;
            return Convert.ToHexString(hashBytes);
        }
    }
}
