// Application/Sensibilisation/FormationMappingExtensions.cs
using System.Globalization;
using backend.Application.DTOs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;

namespace backend.Application.Sensibilisation;

public static class FormationMappingExtensions
{
    public static string ToLabel(this FormationMode m) => m switch
    {
        FormationMode.Distanciel => "Distanciel",
        FormationMode.Elearning => "E-learning",
        _ => "Présentiel",
    };

    public static string ToLabel(this FormationStatus s) => s switch
    {
        FormationStatus.EnCours => "En cours",
        FormationStatus.Terminee => "Terminée",
        _ => "Planifiée",
    };

    public static FormationMode ToMode(this string s) => s switch
    {
        "Distanciel" => FormationMode.Distanciel,
        "E-learning" => FormationMode.Elearning,
        _ => FormationMode.Presentiel,
    };

    public static FormateurType ToFormateurType(this string s) =>
        s == "Externe" ? FormateurType.Externe : FormateurType.Interne;

    public static FormationListDto ToListDto(this Formation f) => new()
    {
        Id = f.Id,
        Reference = f.Reference,
        Title = f.Title,
        Type = f.Mode.ToLabel(),
        Date = f.DateDebut.ToString("yyyy-MM-dd"),
        Heure = f.DateDebut.ToString("HH:mm"),
        Duree = f.Duree,
        Formateur = f.Formateur,
        FormateurType = f.FormateurType.ToString(),
        Departement = f.Departement,
        Role = f.Role,
        Status = f.Status.ToLabel(),
        Participants = f.Participants.Count,
        Presents = f.NbPresents,
        LmsLink = f.LmsLink,
    };

    public static FormationDetailDto ToDetailDto(this Formation f)
    {
        var dto = new FormationDetailDto
        {
            Id = f.Id,
            Reference = f.Reference,
            Title = f.Title,
            Description = f.Description,
            Objectif = f.Objectif,
            Type = f.Mode.ToLabel(),
            Date = f.DateDebut.ToString("yyyy-MM-dd"),
            Heure = f.DateDebut.ToString("HH:mm"),
            Duree = f.Duree,
            Formateur = f.Formateur,
            FormateurType = f.FormateurType.ToString(),
            Departement = f.Departement,
            Role = f.Role,
            Status = f.Status.ToLabel(),
            Participants = f.Participants.Count,
            Presents = f.NbPresents,
            LmsLink = f.LmsLink,
        };

        dto.ParticipantsList = f.Participants.Select(p => new ParticipantDto
        {
            Id = p.Id,
            Initials = p.Initials,
            Name = p.FullName,
            Email = p.Email,
            Dept = p.Department,
            Status = p.Status == ParticipantStatus.Present ? "Présent" : "Invité",
            Color = p.AvatarColor,
        }).ToList();

        dto.Docs = f.FormationDocuments.Select(d => new DocumentDto
        {
            Id = d.Id,
            Name = d.FileName,
            Type = d.FileType,
            Meta = $"{Math.Round(d.FileSizeBytes / 1_048_576.0, 1)} Mo · {d.UploadedAt:dd/MM/yyyy}",
        }).ToList();

        dto.NotifHistory = f.Notifications
            .OrderByDescending(n => n.SentAt)
            .Select(n => new NotificationHistoryDto
            {
                Title = n.Title,
                Date = n.SentAt.ToString("dd MMM yyyy · HH:mm", new CultureInfo("fr-FR")),
                Count = n.RecipientCount,
                Type = "sent",
            }).ToList();

        return dto;
    }
}