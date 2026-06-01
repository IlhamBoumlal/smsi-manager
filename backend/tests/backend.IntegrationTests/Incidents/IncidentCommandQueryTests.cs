using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace backend.IntegrationTests.Incidents;

public class IncidentCommandQueryTests
{
    private const int SocieteId = 71;
    private const int OtherSocieteId = 72;

    [Fact]
    public async Task Queries_ShouldReturnOnlyIncidentsForRequestedSociete()
    {
        await using var db = CreateContext();
        var current = Incident("Courant", SocieteId, new DateTime(2026, 2, 1));
        var older = Incident("Ancien", SocieteId, new DateTime(2026, 1, 1));
        var other = Incident("Autre societe", OtherSocieteId, new DateTime(2026, 3, 1));
        db.Incidents.AddRange(current, older, other);
        await db.SaveChangesAsync();
        var allHandler = new GetAllIncidentsHandler(db, NullLogger<GetAllIncidentsHandler>.Instance);
        var byIdHandler = new GetIncidentByIdHandler(db);

        var all = (await allHandler.Handle(new GetAllIncidentsQuery(SocieteId), CancellationToken.None)).ToList();
        var found = await byIdHandler.Handle(new GetIncidentByIdQuery(current.Id, SocieteId), CancellationToken.None);
        var forbidden = await byIdHandler.Handle(new GetIncidentByIdQuery(other.Id, SocieteId), CancellationToken.None);

        Assert.Equal(2, all.Count);
        Assert.Equal("Courant", all[0].Titre);
        Assert.Equal("Ancien", all[1].Titre);
        Assert.NotNull(found);
        Assert.Null(forbidden);
    }

    [Fact]
    public async Task Update_ShouldModifyOnlyIncidentForRequestedSocieteAndCloseWhenResolved()
    {
        await using var db = CreateContext();
        var incident = Incident("Initial", SocieteId, new DateTime(2026, 1, 1));
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new UpdateIncidentHandler(db);

        var rejected = await handler.Handle(new UpdateIncidentCommand(incident.Id, Dto("Autre societe"), OtherSocieteId), CancellationToken.None);
        var updated = await handler.Handle(new UpdateIncidentCommand(incident.Id, Dto("Resolu", StatutIncident.Resolu), SocieteId), CancellationToken.None);

        Assert.False(rejected);
        Assert.True(updated);
        var saved = await db.Incidents.SingleAsync(i => i.Id == incident.Id);
        Assert.Equal("Resolu", saved.Titre);
        Assert.Equal(StatutIncident.Resolu, saved.Statut);
        Assert.NotNull(saved.ClosedAt);
    }

    [Fact]
    public async Task Delete_ShouldRemoveOnlyIncidentForRequestedSociete()
    {
        await using var db = CreateContext();
        var incident = Incident("A supprimer", SocieteId, new DateTime(2026, 1, 1));
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new DeleteIncidentHandler(db);

        var rejected = await handler.Handle(new DeleteIncidentCommand(incident.Id, OtherSocieteId), CancellationToken.None);
        var deleted = await handler.Handle(new DeleteIncidentCommand(incident.Id, SocieteId), CancellationToken.None);

        Assert.False(rejected);
        Assert.True(deleted);
        Assert.Empty(db.Incidents);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Incident Incident(string titre, int societeId, DateTime date) => new()
    {
        Id = Guid.NewGuid(),
        Titre = titre,
        Description = "Description",
        Date = date,
        Priorite = PrioriteIncident.HAUTE,
        Statut = StatutIncident.EnCours,
        SocieteId = societeId
    };

    private static IncidentDto Dto(string titre, StatutIncident statut = StatutIncident.EnCours) => new()
    {
        Titre = titre,
        Description = "Description maj",
        Priorite = PrioriteIncident.CRITIQUE,
        Statut = statut,
        Resolution = statut == StatutIncident.Resolu ? "Corrige" : null
    };
}
