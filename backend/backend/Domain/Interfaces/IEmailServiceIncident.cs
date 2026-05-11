namespace backend.Domain.Interfaces
{
    public interface IEmailServiceIncident
    {
        Task<bool> SendIncidentNotificationAsync(
            string toEmail,
            string toName,
            string incidentTitle,
            string incidentDescription
        );
    }
}