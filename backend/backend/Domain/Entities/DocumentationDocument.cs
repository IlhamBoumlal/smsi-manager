namespace backend.Domain.Entities
{
    public class DocumentationDocument
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = "brouillon";
        public string Version { get; set; } = "1.0";
        public string Classification { get; set; } = "Interne";
        public string Author { get; set; } = string.Empty;
        public string? Approver { get; set; }
        public string? Clause { get; set; }
        public string? Controle { get; set; }
        public string? Description { get; set; }
        public string? FilePath { get; set; }
        public string? OriginalFileName { get; set; }
        public long? FileSizeBytes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
