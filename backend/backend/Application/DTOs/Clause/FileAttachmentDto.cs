namespace Application.DTOs.Clause
{
    // ── FILE ATTACHMENT ───────────────────────────────────────────────────────

    public class FileAttachmentDto
    {
        public int Id { get; set; }
        public string OriginalName { get; set; } = "";
        public string ContentType { get; set; } = "";
        public long FileSize { get; set; }
        public string? Description { get; set; }
        public string UploadedAt { get; set; } = "";

        /// URL de téléchargement exposée au frontend
        public string DownloadUrl { get; set; } = "";
    }

    // ── CONFORMITY PROOF ─────────────────────────────────────────────────────

    public class ConformityProofDto
    {
        public int Id { get; set; }
        public int IsoClauseId { get; set; }
        public string Description { get; set; } = "";
        public string CreatedAt { get; set; } = "";
        public string UpdatedAt { get; set; } = "";
        public List<FileAttachmentDto> Files { get; set; } = new();
    }

    public class UpsertConformityProofDto
    {
        public int IsoClauseId { get; set; }
        public string Description { get; set; } = "";
    }
}