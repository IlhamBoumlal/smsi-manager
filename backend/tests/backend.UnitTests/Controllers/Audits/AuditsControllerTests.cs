using Application.DTOs;
using backend.API.Controllers;
using backend.Domain.Entities;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Controllers.Audits;

public class AuditsControllerTests
{
    [Fact]
    public async Task GetAll_ShouldReturnOnlyCurrentSocieteAudits()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        db.Audits.AddRange(
            Audit("Audit SMSI", AuditTestHelper.SocieteId),
            Audit("Audit autre societe", AuditTestHelper.OtherSocieteId));
        await db.SaveChangesAsync();
        var controller = AuditTestHelper.CreateController(db);

        var result = await controller.GetAll();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var audits = ok.Value.Should().BeAssignableTo<List<AuditDto>>().Subject;
        audits.Should().ContainSingle();
        audits[0].Title.Should().Be("Audit SMSI");
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenAuditBelongsToAnotherSociete()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        var otherAudit = Audit("Audit inaccessible", AuditTestHelper.OtherSocieteId);
        db.Audits.Add(otherAudit);
        await db.SaveChangesAsync();
        var controller = AuditTestHelper.CreateController(db);

        var result = await controller.GetById(otherAudit.Id);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_ShouldPersistAuditForCurrentSocieteAndReturnCreatedAtAction()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        var controller = AuditTestHelper.CreateController(db);
        var dto = new CreateAuditDto
        {
            Title = "Audit interne 2026",
            Type = "external_cert",
            Status = "planned",
            StartDate = "2026-06-01",
            EndDate = "2026-06-05",
            Auditor = "Auditeur principal",
            Org = "SMSI",
            Scope = "Tous les controles",
            ControlStatuses = new Dictionary<string, string>
            {
                ["5.1"] = "C",
                ["8.3"] = "NC"
            },
            ControlComments = new Dictionary<string, string>
            {
                ["8.3"] = "Mot de passe non conforme"
            }
        };

        var result = await controller.Create(dto);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(AuditsController.GetById));
        var value = created.Value.Should().BeOfType<AuditDto>().Subject;
        value.Title.Should().Be("Audit interne 2026");
        value.ControlStatuses.Should().Contain("8.3", "NC");
        value.ControlComments.Should().Contain("8.3", "Mot de passe non conforme");

        var saved = await db.Audits.Include(a => a.ControlStatuses).SingleAsync();
        saved.SocieteId.Should().Be(AuditTestHelper.SocieteId);
        saved.ControlStatuses.Should().HaveCount(2);
    }

    [Fact]
    public async Task Delete_ShouldReturnNoContentAndRemoveOnlyCurrentSocieteAudit()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        var currentAudit = Audit("Audit a supprimer", AuditTestHelper.SocieteId);
        var otherAudit = Audit("Audit autre societe", AuditTestHelper.OtherSocieteId);
        db.Audits.AddRange(currentAudit, otherAudit);
        await db.SaveChangesAsync();
        var controller = AuditTestHelper.CreateController(db);

        var result = await controller.Delete(currentAudit.Id);

        result.Should().BeOfType<NoContentResult>();
        (await db.Audits.AnyAsync(a => a.Id == currentAudit.Id)).Should().BeFalse();
        (await db.Audits.AnyAsync(a => a.Id == otherAudit.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenAuditBelongsToAnotherSociete()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        var otherAudit = Audit("Audit autre societe", AuditTestHelper.OtherSocieteId);
        db.Audits.Add(otherAudit);
        await db.SaveChangesAsync();
        var controller = AuditTestHelper.CreateController(db);

        var result = await controller.Delete(otherAudit.Id);

        result.Should().BeOfType<NotFoundResult>();
        (await db.Audits.AnyAsync(a => a.Id == otherAudit.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task CreateNC_ShouldPersistNonConformiteWithCorrectiveActionsForCurrentSociete()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        var controller = AuditTestHelper.CreateController(db);
        var dto = new CreateNonConformiteDto
        {
            Title = "NC 8.3",
            Description = "Politique de mots de passe faible",
            ControlId = "8.3",
            Status = "open",
            Responsible = "RSSI",
            Deadline = "2026-07-01",
            CorrectiveActions = new List<CreateActionCorrectiveDto>
            {
                new()
                {
                    Description = "Renforcer la politique de mots de passe",
                    Responsible = "RSSI",
                    Deadline = "2026-06-15",
                    Status = "pending"
                }
            }
        };

        var result = await controller.CreateNC(dto);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(AuditsController.GetNCById));
        var value = created.Value.Should().BeOfType<NonConformiteDto>().Subject;
        value.ControlId.Should().Be("8.3");
        value.CorrectiveActions.Should().ContainSingle();

        var saved = await db.NonConformites.Include(n => n.CorrectiveActions).SingleAsync();
        saved.SocieteId.Should().Be(AuditTestHelper.SocieteId);
        saved.CorrectiveActions.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAllNCs_ShouldReturnOnlyCurrentSocieteNonConformites()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        db.NonConformites.AddRange(
            NonConformite("NC courant", AuditTestHelper.SocieteId),
            NonConformite("NC autre", AuditTestHelper.OtherSocieteId));
        await db.SaveChangesAsync();
        var controller = AuditTestHelper.CreateController(db);

        var result = await controller.GetAllNCs();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var ncs = ok.Value.Should().BeAssignableTo<List<NonConformiteDto>>().Subject;
        ncs.Should().ContainSingle();
        ncs[0].Title.Should().Be("NC courant");
    }

    [Fact]
    public async Task CreateSimulation_ShouldPersistAnswersAndCommentsForCurrentSociete()
    {
        await using var db = AuditTestHelper.CreateDbContext();
        var controller = AuditTestHelper.CreateController(db);
        var dto = new CreateSimulationAuditDto
        {
            Name = "Simulation initiale",
            Author = "Auditeur",
            Date = "2026-05-21",
            Score = 75,
            TotalAnswered = 2,
            Oui = 1,
            Non = 1,
            Answers = new Dictionary<string, string> { ["5.1"] = "yes", ["8.3"] = "no" },
            Comments = new Dictionary<string, string> { ["8.3"] = "A ameliorer" }
        };

        var result = await controller.CreateSimulation(dto);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(AuditsController.GetAllSimulations));
        var value = created.Value.Should().BeOfType<SimulationAuditDto>().Subject;
        value.Answers.Should().Contain("8.3", "no");
        value.Comments.Should().Contain("8.3", "A ameliorer");

        var saved = await db.SimulationAudits.SingleAsync();
        saved.SocieteId.Should().Be(AuditTestHelper.SocieteId);
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

    private static NonConformite NonConformite(string title, int societeId) => new()
    {
        Title = title,
        ControlId = "5.1",
        Status = "open",
        SocieteId = societeId
    };
}
