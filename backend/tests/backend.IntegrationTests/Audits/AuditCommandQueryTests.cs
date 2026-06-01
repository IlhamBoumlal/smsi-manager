using Application.Audits.Commands;
using Application.DTOs;
using backend.Application.Audits.Commands;
using backend.Application.Audits.Queries;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.IntegrationTests.Audits;

public class AuditCommandQueryTests
{
    private const int SocieteId = 33;
    private const int OtherSocieteId = 44;

    [Fact]
    public async Task AuditCommands_ShouldCreateReadAndIsolateBySociete()
    {
        await using var context = CreateContext();
        var create = new CreateAuditCommand(context);
        await create.ExecuteAsync(CreateAuditDto("Audit societe 33"), SocieteId);
        await create.ExecuteAsync(CreateAuditDto("Audit societe 44"), OtherSocieteId);

        var auditsSociete33 = await new GetAllAuditsQuery(context).ExecuteAsync(SocieteId);
        var auditsSociete44 = await new GetAllAuditsQuery(context).ExecuteAsync(OtherSocieteId);
        var missingWithoutSociete = await new GetAllAuditsQuery(context).ExecuteAsync(null);

        var audit33 = Assert.Single(auditsSociete33);
        var audit44 = Assert.Single(auditsSociete44);
        Assert.Equal("Audit societe 33", audit33.Title);
        Assert.Equal("Audit societe 44", audit44.Title);
        Assert.Empty(missingWithoutSociete);
    }

    [Fact]
    public async Task AuditCommands_ShouldUpdateAuditAndReplaceControlStatuses()
    {
        await using var context = CreateContext();
        var created = await new CreateAuditCommand(context).ExecuteAsync(
            new CreateAuditDto
            {
                Title = "Audit initial",
                Type = "external_cert",
                Status = "planned",
                StartDate = "2026-06-01",
                Auditor = "Auditeur",
                Org = "SMSI",
                ControlStatuses = new Dictionary<string, string> { ["5.1"] = "C" },
                ControlComments = new Dictionary<string, string> { ["5.1"] = "OK" }
            },
            SocieteId);
        context.ChangeTracker.Clear();

        var updated = await new UpdateAuditCommand(context).ExecuteAsync(
            created.Id,
            new UpdateAuditDto
            {
                Title = "Audit mis a jour",
                Type = "external_cert",
                Status = "completed",
                StartDate = "2026-06-02",
                EndDate = "2026-06-03",
                Auditor = "Auditeur 2",
                Org = "SMSI",
                ControlStatuses = new Dictionary<string, string> { ["8.3"] = "NC" },
                ControlComments = new Dictionary<string, string> { ["8.3"] = "A corriger" }
            },
            SocieteId);

        Assert.NotNull(updated);
        Assert.Equal("Audit mis a jour", updated!.Title);
        Assert.Equal("completed", updated.Status);
        Assert.DoesNotContain("5.1", updated.ControlStatuses.Keys);
        Assert.Equal("NC", updated.ControlStatuses["8.3"]);
        Assert.Equal("A corriger", updated.ControlComments["8.3"]);

        var storedStatuses = await context.AuditControlStatuses
            .Where(s => s.AuditId == created.Id)
            .ToListAsync();
        var storedStatus = Assert.Single(storedStatuses);
        Assert.Equal("8.3", storedStatus.ControlId);
    }

    [Fact]
    public async Task NonConformiteCommands_ShouldCreateUpdateAndSyncCorrectiveActions()
    {
        await using var context = CreateContext();
        var created = await new CreateNonConformiteCommand(context).ExecuteAsync(
            new CreateNonConformiteDto
            {
                Title = "NC initiale",
                ControlId = "8.3",
                Status = "open",
                CorrectiveActions = new List<CreateActionCorrectiveDto>
                {
                    new() { Description = "Action initiale", Status = "pending" }
                }
            },
            SocieteId);

        var originalAction = Assert.Single(created.CorrectiveActions);
        var updated = await new UpdateNonConformiteCommand(context).ExecuteAsync(
            created.Id,
            new UpdateNonConformiteDto
            {
                Title = "NC mise a jour",
                ControlId = "8.3",
                Status = "in-progress",
                CorrectiveActions = new List<CreateActionCorrectiveDto>
                {
                    new()
                    {
                        Id = originalAction.Id.ToString(),
                        Description = "Action modifiee",
                        Status = "done"
                    },
                    new() { Description = "Nouvelle action", Status = "pending" }
                }
            },
            SocieteId);

        Assert.NotNull(updated);
        Assert.Equal("NC mise a jour", updated!.Title);
        Assert.Equal("in-progress", updated.Status);
        Assert.Equal(2, updated.CorrectiveActions.Count);
        Assert.Contains(updated.CorrectiveActions, a => a.Description == "Action modifiee" && a.Status == "done");
        Assert.Contains(updated.CorrectiveActions, a => a.Description == "Nouvelle action");
    }

    [Fact]
    public async Task SimulationCommands_ShouldPersistJsonAndReturnOnlyCurrentSocieteHistory()
    {
        await using var context = CreateContext();
        await new CreateSimulationCommand(context).ExecuteAsync(CreateSimulationDto("Simulation 33"), SocieteId);
        await new CreateSimulationCommand(context).ExecuteAsync(CreateSimulationDto("Simulation 44"), OtherSocieteId);

        var simulations = await new GetAllSimulationsQuery(context).ExecuteAsync(SocieteId);

        var simulation = Assert.Single(simulations);
        Assert.Equal("Simulation 33", simulation.Name);
        Assert.Equal("no", simulation.Answers["8.3"]);
        Assert.Equal("A ameliorer", simulation.Comments["8.3"]);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static CreateAuditDto CreateAuditDto(string title) => new()
    {
        Title = title,
        Type = "external_cert",
        Status = "planned",
        StartDate = "2026-06-01",
        Auditor = "Auditeur",
        Org = "SMSI"
    };

    private static CreateSimulationAuditDto CreateSimulationDto(string name) => new()
    {
        Name = name,
        Author = "Auditeur",
        Date = "2026-05-21",
        Score = 50,
        TotalAnswered = 2,
        Oui = 1,
        Non = 1,
        Answers = new Dictionary<string, string> { ["5.1"] = "yes", ["8.3"] = "no" },
        Comments = new Dictionary<string, string> { ["8.3"] = "A ameliorer" }
    };
}
