namespace backend.Domain.Entities
{
    public class DocumentationDocument
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public int? SocieteId { get; set; }
        public Societe? Societe { get; set; }
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
        public string? Processus { get; set; }
        public string? Description { get; set; }
        public string? FilePath { get; set; }
        public string? OriginalFileName { get; set; }
        public long? FileSizeBytes { get; set; }
        public string? FileHash { get; set; }
        public string? CreatedByUserId { get; set; }
        public ApplicationUser? CreatedByUser { get; set; }
        public string? LastModifiedByUserId { get; set; }
        public ApplicationUser? LastModifiedByUser { get; set; }
        public string? ApprovedByUserId { get; set; }
        public ApplicationUser? ApprovedByUser { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
