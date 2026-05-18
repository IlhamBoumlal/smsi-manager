using backend.Domain.Interfaces;
using FluentEmail.Core;
using Microsoft.Extensions.Logging;

namespace backend.Infrastructure.Services
{
    public class EmailServiceIncident : IEmailServiceIncident
    {
        private readonly IFluentEmail _fluentEmail;
        private readonly ILogger<EmailServiceIncident> _logger;

        public EmailServiceIncident(
            IFluentEmail fluentEmail,
            ILogger<EmailServiceIncident> logger)
        {
            _fluentEmail = fluentEmail;
            _logger = logger;
        }

        public async Task<bool> SendIncidentNotificationAsync(
            string toEmail,
            string toName,
            string incidentTitle,
            string incidentDescription)
        {
            try
            {
                var template = $@"
                    <h2 style='color:#1e3a5f;'>Nouvel incident déclaré</h2>
                    <p>Bonjour <strong>{toName}</strong>,</p>
                    <p>Un nouvel incident a été déclaré dans le système SMSI :</p>
                    <div style='background:#fef2f2; padding:15px; border-left:4px solid #dc2626; margin:20px 0;'>
                        <strong>Titre :</strong> {incidentTitle}<br/>
                        <strong>Description :</strong> {incidentDescription ?? "Aucune description"}<br/>
                        <strong>Date :</strong> {DateTime.Now:dd/MM/yyyy HH:mm}
                    </div>
                    <p>Merci de vous connecter à l'application pour traiter cet incident.</p>
                    <hr/>
                    <small>SMSI Manager - Système de gestion des incidents</small>
                ";

                var response = await _fluentEmail
                    .To(toEmail, toName)
                    .Subject($"Nouvel incident : {incidentTitle}")
                    .Body(template, true)
                    .SendAsync();

                if (!response.Successful)
                {
                    var errors = response.ErrorMessages is { Count: > 0 }
                        ? string.Join(" | ", response.ErrorMessages)
                        : "Erreur SMTP inconnue";

                    _logger.LogError(
                        "Échec envoi email incident vers {Email}. Détails: {Errors}",
                        toEmail,
                        errors);
                }

                return response.Successful;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception lors de l'envoi email incident vers {Email}", toEmail);
                return false;
            }
        }
    }
}
