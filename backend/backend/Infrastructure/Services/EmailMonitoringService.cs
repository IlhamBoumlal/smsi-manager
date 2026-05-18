using backend.Application.DTOs.Settings;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Text;
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

            _logger.LogInformation("EmailMonitoringService démarré — surveillance depuis {StartupTime:u}", _startupTime);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckEmails(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de la vérification des emails");
                }

                await Task.Delay(
                    TimeSpan.FromSeconds(_settings.CheckIntervalSeconds),
                    stoppingToken);
            }
        }

        private async Task CheckEmails(CancellationToken stoppingToken)
        {
            using var client = new ImapClient();

            try
            {
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));

                await client.ConnectAsync(
                    _settings.ImapServer, _settings.Port, _settings.UseSsl,
                    timeoutCts.Token);

                await client.AuthenticateAsync(
                    _settings.Username, _settings.Password,
                    timeoutCts.Token);

                var inbox = client.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadWrite, timeoutCts.Token);

                // Seulement les emails non lus arrivés APRÈS le démarrage du service
                var query = SearchQuery.And(
                    SearchQuery.NotSeen,
                    SearchQuery.DeliveredAfter(_startupTime.AddMinutes(-1)));

                var allUids = await inbox.SearchAsync(query, timeoutCts.Token);
                var recentUids = allUids.TakeLast(10).ToList();

                _logger.LogInformation(
                    "{Count} nouveau(x) email(s) non lu(s) depuis le démarrage",
                    recentUids.Count);

                foreach (var uid in recentUids)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var message = await inbox.GetMessageAsync(uid, timeoutCts.Token);
                    await ProcessEmail(message, stoppingToken);

                    // Marquer comme lu APRÈS traitement réussi
                    await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, timeoutCts.Token);
                }

                await client.DisconnectAsync(true, timeoutCts.Token);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Vérification email annulée (timeout ou arrêt)");
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
                var to = message.To.Mailboxes.FirstOrDefault()?.Address
                              ?? _settings.Username; // fallback : adresse surveillée
                var subject = message.Subject ?? "Sans sujet";
                var body = message.TextBody ?? message.HtmlBody ?? "";

                if (body.Length > 500)
                    body = body[..500];

                _logger.LogInformation(
                    "Traitement email — De: {From} / À: {To} / Sujet: {Subject}",
                    from, to, subject);

                var importDto = new
                {
                    from = from,
                    to = to,        // ← transmis pour résolution du SocieteId
                    subject = subject,
                    body = body,
                    receivedAt = message.Date.DateTime
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(importDto),
                    Encoding.UTF8,
                    "application/json");

                var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    "http://localhost:5006/api/incidents/email-import")
                {
                    Content = content
                };

                // Clé interne pour contourner l'authentification JWT
                if (!string.IsNullOrWhiteSpace(_settings.InternalImportKey))
                {
                    request.Headers.Add(
                        "X-Internal-EmailImport-Key",
                        _settings.InternalImportKey);
                }

                var response = await _httpClient.SendAsync(request, stoppingToken);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Email traité avec succès — Sujet: {Subject}", subject);
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync(stoppingToken);
                    _logger.LogWarning(
                        "❌ Erreur traitement email — HTTP {StatusCode}: {Error}",
                        (int)response.StatusCode, error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du traitement de l'email");
            }
        }
    }
}