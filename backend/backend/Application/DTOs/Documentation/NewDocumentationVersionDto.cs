namespace backend.Application.DTOs.Documentation
{
    public class NewDocumentationVersionDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Classification { get; set; } = "Interne";
        public string Author { get; set; } = string.Empty;
        public string? Approver { get; set; }
        public string? Clause { get; set; }
        public string? Controle { get; set; }
        public string? Processus { get; set; }
        public string? Description { get; set; }
        public bool RemoveFile { get; set; }
    }
}
