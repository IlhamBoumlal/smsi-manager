using Application.Audits.Commands;
using Application.DTOs;
using backend.Application.Audits.Commands;
using backend.Application.Audits.Queries;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Handlers.Audits;

public class AuditHandlerTests
{
    private const int SocieteId = 33;
    private const int OtherSocieteId = 44;

    [Fact]
    public async Task CreateAudit_ShouldPersistAuditControlStatusesAndSociete()
    {
        await using var db = CreateDbContext();
        var command = new CreateAuditCommand(db);

        var result = await command.ExecuteAsync(new CreateAuditDto
        {
            Title = "Audit certification 2026",
            Type = "external_cert",
            Status = "planned",
            StartDate = "2026-06-01",
            Auditor = "Auditeur",
            Org = "SMSI",
            ControlStatuses = new Dictionary<string, string> { ["5.1"] = "C", ["8.3"] = "NC" },
            ControlComments = new Dictionary<string, string> { ["8.3"] = "A corriger" }
        }, SocieteId);

        result.Title.Should().Be("Audit certification 2026");
        result.ControlStatuses.Should().Contain("8.3", "NC");
        result.ControlComments.Should().Contain("8.3", "A corriger");

        var saved = await db.Audits.Include(a => a.ControlStatuses).SingleAsync();
        saved.SocieteId.Should().Be(SocieteId);
        saved.ControlStatuses.Should().AllSatisfy(status =>
        {
            status.AuditId.Should().Be(saved.Id);
            status.SocieteId.Should().Be(SocieteId);
        });
    }

    [Fact]
    public async Task GetAllAudits_ShouldReturnOnlyRequestedSociete()
    {
        await using var db = CreateDbContext();
        db.Audits.AddRange(
            Audit("Audit societe courante", SocieteId),
            Audit("Audit autre societe", OtherSocieteId));
        await db.SaveChangesAsync();

        var result = await new GetAllAuditsQuery(db).ExecuteAsync(SocieteId);

        result.Should().ContainSingle();
        result[0].Title.Should().Be("Audit societe courante");
    }

    [Fact]
    public async Task UpdateAudit_ShouldReturnNull_WhenAuditBelongsToAnotherSociete()
    {
        await using var db = CreateDbContext();
        var otherAudit = Audit("Audit inaccessible", OtherSocieteId);
        db.Audits.Add(otherAudit);
        await db.SaveChangesAsync();

        var result = await new UpdateAuditCommand(db).ExecuteAsync(otherAudit.Id, UpdateAuditDto("Tentative"), SocieteId);

        result.Should().BeNull();
        (await db.Audits.SingleAsync(a => a.Id == otherAudit.Id)).Title.Should().Be("Audit inaccessible");
    }

    [Fact]
    public async Task UpdateAudit_ShouldReplaceControlStatuses()
    {
        await using var db = CreateDbContext();
        var created = await new CreateAuditCommand(db).ExecuteAsync(new CreateAuditDto
        {
            Title = "Audit initial",
            Type = "external_cert",
            Status = "planned",
            StartDate = "2026-06-01",
            Auditor = "Auditeur",
            Org = "SMSI",
            ControlStatuses = new Dictionary<string, string> { ["5.1"] = "C" },
            ControlComments = new Dictionary<string, string> { ["5.1"] = "OK" }
        }, SocieteId);
        db.ChangeTracker.Clear();

        var result = await new UpdateAuditCommand(db).ExecuteAsync(created.Id, new UpdateAuditDto
        {
            Title = "Audit termine",
            Type = "external_cert",
            Status = "completed",
            StartDate = "2026-06-02",
            Auditor = "Auditeur 2",
            Org = "SMSI",
            ControlStatuses = new Dictionary<string, string> { ["8.3"] = "NC" },
            ControlComments = new Dictionary<string, string> { ["8.3"] = "Action requise" }
        }, SocieteId);

        result.Should().NotBeNull();
        result!.Status.Should().Be("completed");
        result.ControlStatuses.Should().NotContainKey("5.1");
        result.ControlStatuses.Should().Contain("8.3", "NC");

        var statuses = await db.AuditControlStatuses.Where(s => s.AuditId == created.Id).ToListAsync();
        statuses.Should().ContainSingle(s => s.ControlId == "8.3" && s.Statut == "NC");
    }

    [Fact]
    public async Task DeleteAudit_ShouldRemoveOnlyCurrentSocieteAudit()
    {
        await using var db = CreateDbContext();
        var currentAudit = Audit("Audit a supprimer", SocieteId);
        var otherAudit = Audit("Audit autre societe", OtherSocieteId);
        db.Audits.AddRange(currentAudit, otherAudit);
        await db.SaveChangesAsync();

        var deleted = await new DeleteAuditCommand(db).ExecuteAsync(currentAudit.Id, SocieteId);
        var otherDeleted = await new DeleteAuditCommand(db).ExecuteAsync(otherAudit.Id, SocieteId);

        deleted.Should().BeTrue();
        otherDeleted.Should().BeFalse();
        (await db.Audits.AnyAsync(a => a.Id == currentAudit.Id)).Should().BeFalse();
        (await db.Audits.AnyAsync(a => a.Id == otherAudit.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task CreateNonConformite_ShouldPersistCorrectiveActions()
    {
        await using var db = CreateDbContext();

        var result = await new CreateNonConformiteCommand(db).ExecuteAsync(new CreateNonConformiteDto
        {
            Title = "NC 8.3",
            ControlId = "8.3",
            Status = "open",
            CorrectiveActions = new List<CreateActionCorrectiveDto>
            {
                new() { Description = "Renforcer la politique", Status = "pending" }
            }
        }, SocieteId);

        result.CorrectiveActions.Should().ContainSingle();
        var saved = await db.NonConformites.Include(n => n.CorrectiveActions).SingleAsync();
        saved.SocieteId.Should().Be(SocieteId);
        saved.CorrectiveActions.Should().ContainSingle(a => a.Description == "Renforcer la politique");
    }

    [Fact]
    public async Task UpdateNonConformite_ShouldSyncCorrectiveActions()
    {
        await using var db = CreateDbContext();
        var created = await new CreateNonConformiteCommand(db).ExecuteAsync(new CreateNonConformiteDto
        {
            Title = "NC initiale",
            ControlId = "5.1",
            Status = "open",
            CorrectiveActions = new List<CreateActionCorrectiveDto>
            {
                new() { Description = "Action initiale", Status = "pending" }
            }
        }, SocieteId);

        var existingAction = created.CorrectiveActions.Single();
        var result = await new UpdateNonConformiteCommand(db).ExecuteAsync(created.Id, new UpdateNonConformiteDto
        {
            Title = "NC mise a jour",
            ControlId = "5.1",
            Status = "in-progress",
            CorrectiveActions = new List<CreateActionCorrectiveDto>
            {
                new() { Id = existingAction.Id.ToString(), Description = "Action modifiee", Status = "done" },
                new() { Description = "Nouvelle action", Status = "pending" }
            }
        }, SocieteId);

        result.Should().NotBeNull();
        result!.CorrectiveActions.Should().HaveCount(2);
        result.CorrectiveActions.Should().Contain(a => a.Description == "Action modifiee" && a.Status == "done");
        result.CorrectiveActions.Should().Contain(a => a.Description == "Nouvelle action");
    }

    [Fact]
    public async Task CreateSimulation_ShouldPersistJsonPayload()
    {
        await using var db = CreateDbContext();

        var result = await new CreateSimulationCommand(db).ExecuteAsync(new CreateSimulationAuditDto
        {
            Name = "Simulation ISO",
            Date = "2026-05-21",
            Score = 50,
            TotalAnswered = 2,
            Oui = 1,
            Non = 1,
            Answers = new Dictionary<string, string> { ["5.1"] = "yes", ["8.3"] = "no" },
            Comments = new Dictionary<string, string> { ["8.3"] = "A ameliorer" }
        }, SocieteId);

        result.Answers.Should().Contain("8.3", "no");
        result.Comments.Should().Contain("8.3", "A ameliorer");
        (await db.SimulationAudits.SingleAsync()).SocieteId.Should().Be(SocieteId);
    }

    [Fact]
    public async Task DeleteSimulation_ShouldReturnFalseForAnotherSociete()
    {
        await using var db = CreateDbContext();
        var simulation = new SimulationAudit
        {
            Name = "Simulation autre societe",
            SocieteId = OtherSocieteId,
            Date = new DateTime(2026, 5, 21)
        };
        db.SimulationAudits.Add(simulation);
        await db.SaveChangesAsync();

        var deleted = await new DeleteSimulationCommand(db).ExecuteAsync(simulation.Id, SocieteId);

        deleted.Should().BeFalse();
        (await db.SimulationAudits.AnyAsync(s => s.Id == simulation.Id)).Should().BeTrue();
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Audit Audit(string title, int societeId) => new()
    {
        Title = title,
        Type = "external_cert",
        Status = "planned",
        StartDate = new DateTime(2026, 6, 1),
        Auditor = "Auditeur",
        Org = "SMSI",
        SocieteId = societeId
    };

    private static UpdateAuditDto UpdateAuditDto(string title) => new()
    {
        Title = title,
        Type = "external_cert",
        Status = "planned",
        StartDate = "2026-06-01",
        Auditor = "Auditeur",
        Org = "SMSI"
    };
}
