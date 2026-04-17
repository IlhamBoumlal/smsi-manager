// Infrastructure/Services/IEmailService.cs
namespace backend.Infrastructure.Services;

public interface IEmailService
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