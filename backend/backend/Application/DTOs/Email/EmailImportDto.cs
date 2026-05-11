namespace backend.Application.DTOs.Email
{
    public class EmailImportDto
    {
        public string From { get; set; } = string.Empty;

        /// Sujet de l'email → deviendra le titre de l'incident
        
        public string Subject { get; set; } = string.Empty;

        /// Corps de l'email → deviendra la description de l'incident
        public string Body { get; set; } = string.Empty;

        /// Date de réception de l'email
        public DateTime? ReceivedAt { get; set; }
    }
}

