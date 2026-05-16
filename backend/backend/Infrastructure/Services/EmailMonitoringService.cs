using backend.Application.DTOs.Settings;
using MailKit.Search;
using MailKit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Text;
using MailKit.Net.Imap;
using System.Text.Json;

namespace backend.Infrastructure.Services
{
    public class EmailMonitoringService : BackgroundService
    {
        private readonly ILogger<EmailMonitoringService> _logger;
        private readonly EmailMonitoringSettings _settings;
        private readonly HttpClient _httpClient;
        private readonly DateTime _startupTime;

        public EmailMonitoringService(
            ILogger<EmailMonitoringService> logger,
            IOptions<EmailMonitoringSettings> settings,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _settings = settings.Value;
            _httpClient = httpClientFactory.CreateClient();
            _startupTime = DateTime.UtcNow;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_settings.Enabled)
            {
                _logger.LogInformation("EmailMonitoringService est désactivé");
                return;
            }

            _logger.LogInformation("EmailMonitoringService démarré");
          // await MarkAllOldEmailsAsRead();


            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckEmails(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de la vérification des emails");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(_settings.CheckIntervalSeconds), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }

            _logger.LogInformation("EmailMonitoringService arrêté");
        }
        private async Task CheckEmails(CancellationToken stoppingToken)
        {
            using var client = new ImapClient();

            try
            {
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));

                await client.ConnectAsync(_settings.ImapServer, _settings.Port, _settings.UseSsl, timeoutCts.Token);
                await client.AuthenticateAsync(_settings.Username, _settings.Password, timeoutCts.Token);

                var inbox = client.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadWrite, timeoutCts.Token);

                // ✅ CORRECTION : Ne traiter que les emails arrivés APRÈS le démarrage du service
                var query = SearchQuery.And(
                    SearchQuery.NotSeen,
                    SearchQuery.DeliveredAfter(_startupTime.AddMinutes(-1)) // Marge d'1 minute
                );

                var allUids = await inbox.SearchAsync(query, timeoutCts.Token);
                var recentUids = allUids.TakeLast(10).ToList();

                _logger.LogInformation("{Count} nouveau(x) email(s) non lu(s) depuis le démarrage", recentUids.Count);

                foreach (var uid in recentUids)
                {
                    if (stoppingToken.IsCancellationRequested)
                        break;

                    var message = await inbox.GetMessageAsync(uid, timeoutCts.Token);
                    await ProcessEmail(message, stoppingToken);
                    await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, timeoutCts.Token);
                }

                await client.DisconnectAsync(true, timeoutCts.Token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur IMAP");
            }
        }
        private async Task ProcessEmail(MimeMessage message, CancellationToken stoppingToken)
        {
            try
            {
                var from = message.From.Mailboxes.FirstOrDefault()?.Address ?? "inconnu";
                var subject = message.Subject ?? "Sans sujet";
                var body = message.TextBody ?? message.HtmlBody ?? "";

                // Nettoyer le corps (limiter à 500 caractères)
                if (body.Length > 500)
                    body = body.Substring(0, 500);

                _logger.LogInformation("Traitement email de {From}: {Subject}", from, subject);

                // Appeler l'API d'import
                var importDto = new
                {
                    from = from,
                    subject = subject,
                    body = body,
                    receivedAt = message.Date.DateTime
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(importDto),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync(
                    "http://localhost:5006/api/incidents/email-import",
                    content,
                    stoppingToken);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email traité avec succès: {Subject}", subject);
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync(stoppingToken);
                    _logger.LogWarning("Erreur lors du traitement de l'email: {Error}", error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du traitement de l'email");
            }
        }

        // Ajoute cette méthode dans la classe EmailMonitoringService
        // Méthode temporaire - À SUPPRIMER APRÈS EXÉCUTION
        private async Task MarkAllOldEmailsAsRead()
        {
            using var client = new ImapClient();

            try
            {
                _logger.LogInformation("=== NETTOYAGE DE LA BOÎTE EMAIL ===");

                await client.ConnectAsync(_settings.ImapServer, _settings.Port, _settings.UseSsl);
                await client.AuthenticateAsync(_settings.Username, _settings.Password);

                var inbox = client.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadWrite);

                // Date limite : ne garder que les 7 derniers jours
                var cutoffDate = DateTime.UtcNow.AddDays(-7);
                var oldUids = await inbox.SearchAsync(SearchQuery.DeliveredBefore(cutoffDate));

                _logger.LogInformation("{Count} emails avant le {CutoffDate} vont être marqués comme lus",
                    oldUids.Count, cutoffDate);

                int count = 0;
                foreach (var uid in oldUids)
                {
                    await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true);
                    count++;
                    if (count % 100 == 0)
                    {
                        _logger.LogInformation("Progression: {Count}/{Total} emails marqués", count, oldUids.Count);
                    }
                }

                _logger.LogInformation("{Count} emails ont été marqués comme lus", count);

                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du nettoyage");
            }
        }
    }
}
