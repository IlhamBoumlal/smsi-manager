using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using backend.Domain.Interfaces;
using backend.Domain.Enumerations;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace backend.UnitTests.Handlers.Incidents;

public class IncidentHandlerTests
{
    [Fact]
    public async Task CreateIncident_ShouldPersistIncidentWithCurrentSocieteAndEnCoursStatus()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var emailService = new Mock<IEmailServiceIncident>();
        emailService.Setup(s => s.SendIncidentNotificationAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .ReturnsAsync(true);
        var handler = new CreateIncidentHandler(
            db,
            new Mock<IUserRepository>().Object,
            emailService.Object,
            IncidentTestHelper.CreateHubContextMock().Object,
            NullLogger<CreateIncidentHandler>.Instance,
            new HttpContextAccessor(),
            CreateConfiguration());

        var id = await handler.Handle(
            new CreateIncidentCommand(IncidentTestHelper.Dto("Incident critique"), IncidentTestHelper.SocieteId),
            CancellationToken.None);

        var saved = await db.Incidents.FindAsync(id);
        saved.Should().NotBeNull();
        saved!.Titre.Should().Be("Incident critique");
        saved.SocieteId.Should().Be(IncidentTestHelper.SocieteId);
        saved.Statut.Should().Be(StatutIncident.EnCours);
        saved.Date.Should().NotBeNull();
        emailService.Verify(s => s.SendIncidentNotificationAsync(
            "security@example.test",
            "Entreprise",
            "Incident critique",
            "Perte de connectivite"), Times.Once);
    }

    [Fact]
    public async Task GetAllIncidents_ShouldReturnOnlyRequestedSocieteOrderedByDateDescending()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        db.Incidents.AddRange(
            IncidentTestHelper.Incident(titre: "Ancien", societeId: IncidentTestHelper.SocieteId).WithDate(new DateTime(2026, 1, 1)),
            IncidentTestHelper.Incident(titre: "Recent", societeId: IncidentTestHelper.SocieteId).WithDate(new DateTime(2026, 2, 1)),
            IncidentTestHelper.Incident(titre: "Autre societe", societeId: IncidentTestHelper.OtherSocieteId).WithDate(new DateTime(2026, 3, 1)));
        await db.SaveChangesAsync();
        var handler = new GetAllIncidentsHandler(db, NullLogger<GetAllIncidentsHandler>.Instance);

        var result = (await handler.Handle(new GetAllIncidentsQuery(IncidentTestHelper.SocieteId), CancellationToken.None)).ToList();

        result.Should().HaveCount(2);
        result[0].Titre.Should().Be("Recent");
        result[1].Titre.Should().Be("Ancien");
    }

    [Fact]
    public async Task GetIncidentById_ShouldReturnNull_WhenIncidentBelongsToAnotherSociete()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var incident = IncidentTestHelper.Incident(societeId: IncidentTestHelper.OtherSocieteId);
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new GetIncidentByIdHandler(db);

        var result = await handler.Handle(new GetIncidentByIdQuery(incident.Id, IncidentTestHelper.SocieteId), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateIncident_ShouldResolveIncidentAndSetClosedAt()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var incident = IncidentTestHelper.Incident();
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new UpdateIncidentHandler(db);

        var result = await handler.Handle(
            new UpdateIncidentCommand(incident.Id, IncidentTestHelper.Dto("Incident resolu", StatutIncident.Resolu), IncidentTestHelper.SocieteId),
            CancellationToken.None);

        result.Should().BeTrue();
        var saved = await db.Incidents.FindAsync(incident.Id);
        saved!.Titre.Should().Be("Incident resolu");
        saved.Statut.Should().Be(StatutIncident.Resolu);
        saved.ClosedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateIncident_ShouldClearClosedAt_WhenStatusReturnsToEnCours()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var incident = IncidentTestHelper.Incident(statut: StatutIncident.Resolu);
        incident.ClosedAt = new DateTime(2026, 5, 1);
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new UpdateIncidentHandler(db);

        var result = await handler.Handle(
            new UpdateIncidentCommand(incident.Id, IncidentTestHelper.Dto("Reouvert", StatutIncident.EnCours), IncidentTestHelper.SocieteId),
            CancellationToken.None);

        result.Should().BeTrue();
        (await db.Incidents.FindAsync(incident.Id))!.ClosedAt.Should().BeNull();
    }

    [Fact]
    public async Task UpdateIncident_ShouldRejectMissingSociete()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var incident = IncidentTestHelper.Incident();
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new UpdateIncidentHandler(db);

        var result = await handler.Handle(
            new UpdateIncidentCommand(incident.Id, IncidentTestHelper.Dto(), null),
            CancellationToken.None);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteIncident_ShouldDeleteOnlyRequestedSociete()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var incident = IncidentTestHelper.Incident();
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        var handler = new DeleteIncidentHandler(db);

        var rejected = await handler.Handle(new DeleteIncidentCommand(incident.Id, IncidentTestHelper.OtherSocieteId), CancellationToken.None);
        var deleted = await handler.Handle(new DeleteIncidentCommand(incident.Id, IncidentTestHelper.SocieteId), CancellationToken.None);

        rejected.Should().BeFalse();
        deleted.Should().BeTrue();
        db.Incidents.Should().BeEmpty();
    }

    private static IConfiguration CreateConfiguration() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Email:IncidentCompanyEmail"] = "security@example.test"
            })
            .Build();
}

file static class IncidentTestExtensions
{
    public static backend.Domain.Entities.Incident WithDate(this backend.Domain.Entities.Incident incident, DateTime date)
    {
        incident.Date = date;
        return incident;
    }
}
