namespace backend.Application.DTOs.Email
{
    public class EmailImportDto
    {
        public string? From { get; set; }
        public string? To { get; set; }   
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public DateTime? ReceivedAt { get; set; }
    }
}