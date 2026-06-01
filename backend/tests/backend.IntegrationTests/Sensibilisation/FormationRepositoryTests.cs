using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.IntegrationTests.Sensibilisation;

public class FormationRepositoryTests
{
    private const int SocieteId = 55;
    private const int OtherSocieteId = 66;

    [Fact]
    public async Task Repository_ShouldReturnOnlyFormationsForRequestedSociete()
    {
        await using var context = CreateContext();
        context.Formations.AddRange(
            CreateFormation("Formation societe 55", SocieteId),
            CreateFormation("Formation societe 66", OtherSocieteId));
        await context.SaveChangesAsync();
        var repository = new FormationRepository(context);

        var formations = (await repository.GetAllAsync(SocieteId)).ToList();
        var missingWithoutSociete = (await repository.GetAllAsync(null)).ToList();

        var formation = Assert.Single(formations);
        Assert.Equal("Formation societe 55", formation.Title);
        Assert.Empty(missingWithoutSociete);
    }

    [Fact]
    public async Task Repository_ShouldLoadFormationDetailsWithRelations()
    {
        await using var context = CreateContext();
        var formation = CreateFormation("Formation complete", SocieteId);
        formation.Participants.Add(FormationParticipant.Create(formation.Id, formation.SocieteId, "Alice Martin", "alice@example.com", "IT"));
        formation.FormationDocuments.Add(FormationDocument.Create(
            formation.Id,
            formation.SocieteId,
            "support.pdf",
            "pdf",
            "wwwroot/uploads/sensibilisation/support.pdf",
            2048));
        formation.Notifications.Add(FormationNotification.Create(formation.Id, formation.SocieteId, "Invitation envoyee", 1));
        context.Formations.Add(formation);
        await context.SaveChangesAsync();
        var repository = new FormationRepository(context);

        var loaded = await repository.GetByIdAsync(formation.Id, SocieteId);

        Assert.NotNull(loaded);
        Assert.Single(loaded!.Participants);
        Assert.Single(loaded.FormationDocuments);
        Assert.Single(loaded.Notifications);
    }

    [Fact]
    public async Task Repository_ShouldAddAndRemoveFormationDocument()
    {
        await using var context = CreateContext();
        var formation = CreateFormation("Formation documents", SocieteId);
        context.Formations.Add(formation);
        await context.SaveChangesAsync();
        var repository = new FormationRepository(context);
        var document = FormationDocument.Create(
            formation.Id,
            SocieteId,
            "guide.pdf",
            "pdf",
            "wwwroot/uploads/sensibilisation/guide.pdf",
            1024);

        await repository.AddDocumentAsync(document);
        await repository.SaveChangesAsync();
        repository.RemoveDocument(document);
        await repository.SaveChangesAsync();

        Assert.Empty(await context.FormationDocuments.ToListAsync());
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Formation CreateFormation(string title, int societeId)
        => Formation.Create(
            title,
            "Description",
            "Objectif",
            FormationMode.Presentiel,
            new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc),
            "2h",
            "RSSI",
            FormateurType.Interne,
            "IT",
            "Collaborateur",
            null,
            false,
            false,
            societeId);
}
