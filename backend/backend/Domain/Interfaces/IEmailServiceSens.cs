namespace backend.Domain.Interfaces
{
    public interface IEmailServiceSens
    {
        Task SendInvitationAsync(
        string toEmail, string toName,
        string formationTitle, DateTime dateDebut,
        string duree, string formateur,
        string? lmsLink, CancellationToken ct = default);

        Task SendRappelAsync(
            string toEmail, string toName,
            string formationTitle, DateTime dateDebut,
            CancellationToken ct = default);

        Task SendNotificationAsync(
            string toEmail, string toName,
            string subject, string htmlBody,
            CancellationToken ct = default);
    }
}
