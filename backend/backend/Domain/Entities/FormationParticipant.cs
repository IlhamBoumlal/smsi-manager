// Domain/Entities/FormationParticipant.cs
using backend.Domain.Enumerations;

namespace backend.Domain.Entities;

public class FormationParticipant
{
    public Guid Id { get; private set; }
    public Guid FormationId { get; private set; }
    public int? SocieteId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Initials { get; private set; } = string.Empty;
    public string Department { get; private set; } = string.Empty;
    public string AvatarColor { get; private set; } = "blue";
    public ParticipantStatus Status { get; set; }

    // Navigation
    public Formation Formation { get; private set; } = null!;
    public Societe? Societe { get; private set; }

    private FormationParticipant() { }

    private static readonly string[] Colors = ["blue", "purple", "teal", "coral", "amber", "green"];

    public static FormationParticipant Create(
        Guid formationId, int? societeId, string fullName, string email, string department)
    {
        var parts = fullName.Trim().Split(' ', 2);
        var initials = parts.Length >= 2
            ? $"{char.ToUpper(parts[0][0])}{char.ToUpper(parts[1][0])}"
            : fullName[..Math.Min(2, fullName.Length)].ToUpper();

        return new FormationParticipant
        {
            Id = Guid.NewGuid(),
            FormationId = formationId,
            SocieteId = societeId,
            FullName = fullName,
            Email = email,
            Initials = initials,
            Department = department,
            AvatarColor = Colors[Random.Shared.Next(Colors.Length)],
            Status = ParticipantStatus.Invite,
        };
    }
}
