// Domain/Entities/FormationNotification.cs
namespace backend.Domain.Entities;

public class FormationNotification
{
    public Guid Id { get; private set; }
    public Guid FormationId { get; private set; }
    public int? SocieteId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public int RecipientCount { get; private set; }
    public DateTime SentAt { get; private set; }

    public Formation Formation { get; private set; } = null!;
    public Societe? Societe { get; private set; }

    private FormationNotification() { }

    public static FormationNotification Create(Guid formationId, int? societeId, string title, int count)
        => new()
        {
            Id = Guid.NewGuid(),
            FormationId = formationId,
            SocieteId = societeId,
            Title = title,
            RecipientCount = count,
            SentAt = DateTime.UtcNow,
        };
}
