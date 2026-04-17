// Infrastructure/Services/IEmailService.cs
namespace backend.Infrastructure.Services;

public interface IEmailService
{
    // Méthode pour les incidents
    Task<bool> SendIncidentNotificationAsync(
        string toEmail,
        string toName,
        string incidentTitle,
        string incidentDescription);

    // Méthode pour l'invitation aux formations
    Task SendInvitationAsync(
        string toEmail,
        string toName,
        string formationTitle,
        DateTime dateDebut,
        string duree,
        string formateur,
        string? lmsLink,
        CancellationToken ct = default);

    // Méthode pour le rappel de formation
    Task SendRappelAsync(
        string toEmail,
        string toName,
        string formationTitle,
        DateTime dateDebut,
        CancellationToken ct = default);

    // Méthode pour les notifications génériques
    Task SendNotificationAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        CancellationToken ct = default);
}