using backend.Application.DTOs.Settings;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
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
                _logger.LogInformation("EmailMonitoringService disabled");
                return;
            }

            _logger.LogInformation("EmailMonitoringService started at {StartupTime:u}", _startupTime);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckEmails(stoppingToken);
                }
                catch (AuthenticationException ex)
                {
                    _logger.LogError(ex,
                        "IMAP authentication failed for {User}. Use a Google app password (16 chars) and ensure IMAP is enabled.",
                        _settings.Username);

                    if (_settings.DisableAfterAuthFailure)
                    {
                        _logger.LogWarning("EmailMonitoringService stopped after auth failure (DisableAfterAuthFailure=true).");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Email monitoring check failed");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(_settings.CheckIntervalSeconds), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task CheckEmails(CancellationToken stoppingToken)
        {
            using var client = new ImapClient();

            try
            {
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));

                await client.ConnectAsync(_settings.ImapServer, _settings.Port, _settings.UseSsl, timeoutCts.Token);

                var username = (_settings.Username ?? string.Empty).Trim();
                var password = NormalizeSecret(_settings.Password);

                if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                {
                    _logger.LogWarning("EmailMonitoringService: missing IMAP credentials, check skipped.");
                    return;
                }

                await client.AuthenticateAsync(username, password, timeoutCts.Token);

                var inbox = client.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadWrite, timeoutCts.Token);

                // Only unseen emails received after service startup
                var query = SearchQuery.And(
                    SearchQuery.NotSeen,
                    SearchQuery.DeliveredAfter(_startupTime.AddMinutes(-1)));

                var allUids = await inbox.SearchAsync(query, timeoutCts.Token);
                var recentUids = allUids.TakeLast(10).ToList();

                _logger.LogInformation("{Count} new unseen email(s) since startup", recentUids.Count);

                foreach (var uid in recentUids)
                {
                    if (stoppingToken.IsCancellationRequested)
                        break;

                    var message = await inbox.GetMessageAsync(uid, timeoutCts.Token);
                    await ProcessEmail(message, stoppingToken);

                    // Mark as seen after processing attempt
                    await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, timeoutCts.Token);
                }

                await client.DisconnectAsync(true, timeoutCts.Token);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Email check canceled (timeout or shutdown)");
            }
            catch (AuthenticationException)
            {
                // Let ExecuteAsync apply fallback behavior.
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IMAP error");
            }
        }

        private async Task ProcessEmail(MimeMessage message, CancellationToken stoppingToken)
        {
            try
            {
                var from = message.From.Mailboxes.FirstOrDefault()?.Address ?? "unknown";
                var to = message.To.Mailboxes.FirstOrDefault()?.Address ?? _settings.Username;
                var subject = message.Subject ?? "No subject";
                var body = message.TextBody ?? message.HtmlBody ?? string.Empty;

                if (_settings.IgnoreOwnEmails && IsOwnMailboxAddress(from, _settings.Username))
                {
                    _logger.LogInformation(
                        "Email skipped (sender is monitored mailbox) - From: {From} / Subject: {Subject}",
                        from,
                        subject);
                    return;
                }

                if (body.Length > 500)
                    body = body[..500];

                _logger.LogInformation("Processing email - From: {From} / To: {To} / Subject: {Subject}", from, to, subject);

                var importDto = new
                {
                    from,
                    to,
                    subject,
                    body,
                    receivedAt = message.Date.DateTime
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(importDto),
                    Encoding.UTF8,
                    "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:5006/api/incidents/email-import")
                {
                    Content = content
                };

                if (!string.IsNullOrWhiteSpace(_settings.InternalImportKey))
                {
                    request.Headers.Add("X-Internal-EmailImport-Key", _settings.InternalImportKey);
                }

                var response = await _httpClient.SendAsync(request, stoppingToken);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email imported successfully - Subject: {Subject}", subject);
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync(stoppingToken);
                    _logger.LogWarning(
                        "Email import failed - HTTP {StatusCode}: {Error}",
                        (int)response.StatusCode,
                        error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing incoming email");
            }
        }

        private static string NormalizeSecret(string? secret)
        {
            if (string.IsNullOrWhiteSpace(secret))
                return string.Empty;

            // Allow app passwords copied with spaces.
            return secret.Replace(" ", string.Empty).Trim();
        }

        private static bool IsOwnMailboxAddress(string? from, string? username)
        {
            if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(username))
                return false;

            return string.Equals(from.Trim(), username.Trim(), StringComparison.OrdinalIgnoreCase);
        }
    }
}
