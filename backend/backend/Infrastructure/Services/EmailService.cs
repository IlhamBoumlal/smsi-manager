using backend.Domain.Interfaces;
using FluentEmail.Core;

namespace backend.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IFluentEmail _fluentEmail;

        public EmailService(IFluentEmail fluentEmail)
        {
            _fluentEmail = fluentEmail;
        }

        public async Task<bool> SendIncidentNotificationAsync(
            string toEmail,
            string toName,
            string incidentTitle,
            string incidentDescription)
        {
            try
            {
                // Template HTML de l'email
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
                    .Body(template, true)  // true = HTML
                    .SendAsync();

                return response.Successful;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur envoi email: {ex.Message}");
                return false;
            }
        }
    
}
}
