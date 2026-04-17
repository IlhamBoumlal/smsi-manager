// Domain/Entities/Formation.cs
using backend.Domain.Enumerations;
using System.ComponentModel.DataAnnotations;

namespace backend.Domain.Entities;

public class Formation
{
    public Guid Id { get; private set; }
    public string Reference { get; private set; } = string.Empty; // "F-2025-042"
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Objectif { get; private set; } = string.Empty;
    public FormationMode Mode { get; private set; }
    public DateTime DateDebut { get; private set; }
    public string Duree { get; private set; } = string.Empty;
    public string Formateur { get; private set; } = string.Empty;
    public FormateurType FormateurType { get; private set; }
    public string Departement { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty;
    public FormationStatus Status { get; private set; }
    public string? LmsLink { get; private set; }
    public bool NotifInvit { get; private set; }
    public bool NotifRappel { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? SocieteId { get; private set; }
    
    public ICollection<FormationParticipant> Participants { get; private set; } = new List<FormationParticipant>();
    public ICollection<FormationDocument> FormationDocuments { get; private set; } = new List<FormationDocument>();
    public ICollection<FormationNotification> Notifications { get; private set; } = new List<FormationNotification>();

    // EF Core constructor
    private Formation() { }

    public static Formation Create(
        string title, string description, string objectif,
        FormationMode mode, DateTime dateDebut, string duree,
        string formateur, FormateurType formateurType,
        string departement, string role,
        string? lmsLink, bool notifInvit, bool notifRappel,
        Guid? societeId)
    {
        // Génère une référence unique : F-YYYY-XXXX
        var seq = new Random().Next(1, 9999).ToString("D3");
        return new Formation
        {
            Id = Guid.NewGuid(),
            Reference = $"F-{dateDebut.Year}-{seq}",
            Title = title,
            Description = description,
            Objectif = objectif,
            Mode = mode,
            DateDebut = dateDebut,
            Duree = duree,
            Formateur = formateur,
            FormateurType = formateurType,
            Departement = departement,
            Role = role,
            Status = FormationStatus.Planifiee,
            LmsLink = lmsLink,
            NotifInvit = notifInvit,
            NotifRappel = notifRappel,
            CreatedAt = DateTime.UtcNow,
            SocieteId = societeId,
        };
    }

    public void Update(
        string title, string description, string objectif,
        FormationMode mode, DateTime dateDebut, string duree,
        string formateur, FormateurType formateurType,
        string departement, string role, string? lmsLink)
    {
        Title = title;
        Description = description;
        Objectif = objectif;
        Mode = mode;
        DateDebut = dateDebut;
        Duree = duree;
        Formateur = formateur;
        FormateurType = formateurType;
        Departement = departement;
        Role = role;
        LmsLink = lmsLink;
    }

    public void SetStatus(FormationStatus status) => Status = status;

    public int NbPresents =>
        Participants.Count(p => p.Status == ParticipantStatus.Present);
}