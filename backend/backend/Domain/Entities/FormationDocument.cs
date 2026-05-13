// Domain/Entities/FormationDocument.cs
namespace backend.Domain.Entities;

public class FormationDocument
{
    public Guid Id { get; private set; }
    public Guid FormationId { get; private set; }
    public int? SocieteId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string FileType { get; private set; } = string.Empty; // "pdf" | "file"
    public string StoragePath { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public DateTime UploadedAt { get; private set; }

    public Formation Formation { get; private set; } = null!;
    public Societe? Societe { get; private set; }

    private FormationDocument() { }

    public static FormationDocument Create(
        Guid formationId, int? societeId, string fileName,
        string fileType, string storagePath, long sizeBytes)
        => new()
        {
            Id = Guid.NewGuid(),
            FormationId = formationId,
            SocieteId = societeId,
            FileName = fileName,
            FileType = fileType,
            StoragePath = storagePath,
            FileSizeBytes = sizeBytes,
            UploadedAt = DateTime.UtcNow,
        };
}
