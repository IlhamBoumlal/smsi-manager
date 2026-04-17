// Infrastructure/Services/FormationEmailService.cs
using System.Net;
using System.Net.Mail;
using FluentEmail.Core;
using FluentEmail.Smtp;
using Microsoft.Extensions.Configuration;

namespace backend.Infrastructure.Services;

public class FormationEmailService(IConfiguration config) : IEmailService
{
    // Crée un sender FluentEmail via Gmail SMTP
    private IFluentEmail BuildEmail(string toEmail, string toName)
    {
        var smtpClient = new SmtpClient(config["Email:SmtpHost"])
        {
            Port = int.Parse(config["Email:SmtpPort"]!),
            Credentials = new NetworkCredential(
                config["Email:SmtpUser"],
                config["Email:SmtpPassword"]),
            EnableSsl = true,
        };

        var sender = new SmtpSender(smtpClient);
        Email.DefaultSender = sender;

        return Email
            .From(config["Email:FromAddress"], config["Email:FromName"])
            .To(toEmail, toName);
    }

    public async Task SendInvitationAsync(
        string toEmail, string toName,
        string formationTitle, DateTime dateDebut,
        string duree, string formateur,
        string? lmsLink, CancellationToken ct = default)
    {
        var dateFr = dateDebut.ToString("dddd d MMMM yyyy", new System.Globalization.CultureInfo("fr-FR"));
        var heureFr = dateDebut.ToString("HH:mm");

        var body = $"""
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
              <div style="background:#1D4ED8;padding:28px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:#fff;margin:0;font-size:20px">🛡️ Invitation — Formation SMSI</h1>
              </div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:28px 32px;border-radius:0 0 12px 12px">
                <p style="color:#374151">Bonjour <strong>{toName}</strong>,</p>
                <p style="color:#374151">Vous êtes invité(e) à participer à la formation :</p>
                <div style="background:#f9fafb;border-left:4px solid #1D4ED8;padding:16px;border-radius:8px;margin:16px 0">
                  <strong style="font-size:16px;color:#111827">{formationTitle}</strong><br/>
                  <span style="color:#6B7280;font-size:13px">📅 {dateFr} · {heureFr} &nbsp;·&nbsp; ⏱ {duree}</span><br/>
                  <span style="color:#6B7280;font-size:13px">👤 Formateur : {formateur}</span>
                  {(lmsLink is not null ? $"<br/><a href=\"{lmsLink}\" style=\"color:#1D4ED8\">🔗 Accéder aux supports en ligne</a>" : "")}
                </div>
                <p style="color:#9CA3AF;font-size:12px">Clause 7.2 & 7.3 — ISO 27001 · Sensibilisation SMSI</p>
              </div>
            </div>
            """;

        await BuildEmail(toEmail, toName)
            .Subject($"[SMSI] Invitation : {formationTitle}")
            .Body(body, isHtml: true)
            .SendAsync(ct);
    }

    public async Task SendRappelAsync(
        string toEmail, string toName,
        string formationTitle, DateTime dateDebut,
        CancellationToken ct = default)
    {
        var dateFr = dateDebut.ToString("dddd d MMMM yyyy", new System.Globalization.CultureInfo("fr-FR"));
        var heureFr = dateDebut.ToString("HH:mm");

        var body = $"""
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
              <div style="background:#D97706;padding:28px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:#fff;margin:0;font-size:20px">⏰ Rappel — Formation dans 48h</h1>
              </div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:28px 32px;border-radius:0 0 12px 12px">
                <p style="color:#374151">Bonjour <strong>{toName}</strong>,</p>
                <p style="color:#374151">Rappel : la formation <strong>{formationTitle}</strong> a lieu dans moins de 48h.</p>
                <p style="color:#374151">📅 <strong>{dateFr} à {heureFr}</strong></p>
                <p style="color:#9CA3AF;font-size:12px">Clause 7.2 & 7.3 — ISO 27001 · Sensibilisation SMSI</p>
              </div>
            </div>
            """;

        await BuildEmail(toEmail, toName)
            .Subject($"[SMSI] Rappel 48h : {formationTitle}")
            .Body(body, isHtml: true)
            .SendAsync(ct);
    }

    public async Task SendNotificationAsync(
        string toEmail, string toName,
        string subject, string htmlBody,
        CancellationToken ct = default)
    {
        await BuildEmail(toEmail, toName)
            .Subject(subject)
            .Body(htmlBody, isHtml: true)
            .SendAsync(ct);
    }
}