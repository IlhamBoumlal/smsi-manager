namespace backend.Application.DTOs.Settings
{
    public class EmailMonitoringSettings
    {
        public bool Enabled { get; set; }
        public bool DisableAfterAuthFailure { get; set; } = true;
        public bool IgnoreOwnEmails { get; set; } = true;
        public string ImapServer { get; set; } = string.Empty;
        public int Port { get; set; }
        public bool UseSsl { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string InternalImportKey { get; set; } = string.Empty;
        public int CheckIntervalSeconds { get; set; } = 30;
    }
}
