namespace backend.Domain.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendIncidentNotificationAsync(
            string toEmail,
            string toName,
            string incidentTitle,
            string incidentDescription
        );
    }
}
