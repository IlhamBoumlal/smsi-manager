using Application.DTOs.Clause;
using backend.Domain.Entities;
using backend.Infrastructure.Services;
using backend.UnitTests.Helpers;
using FluentAssertions;

namespace backend.UnitTests.Services;

public class ClauseServiceTests
{
    [Fact]
    public async Task SeedClausesAsync_ShouldCreateIsoClausesOnlyOnce()
    {
        await using var db = ClauseTestHelper.CreateDbContext();
        var service = new ClauseService(db);

        await service.SeedClausesAsync();
        var countAfterFirstSeed = db.IsoClauses.Count();
        await service.SeedClausesAsync();

        countAfterFirstSeed.Should().BeGreaterThan(0);
        db.IsoClauses.Count().Should().Be(countAfterFirstSeed);
    }

    [Fact]
    public async Task UpsertConformityAsync_ShouldCreateAndThenUpdateSameScopedRecord()
    {
        await using var db = ClauseTestHelper.CreateDbContext();
        var service = new ClauseService(db);

        var created = await service.UpsertConformityAsync(
            41,
            ClauseTestHelper.UserId,
            ClauseTestHelper.SocieteId,
            new UpsertConformityDto { SubClauseId = 41, Status = "non-conforme", Score = 20, Comments = "Initial" });
        var updated = await service.UpsertConformityAsync(
            41,
            ClauseTestHelper.UserId,
            ClauseTestHelper.SocieteId,
            new UpsertConformityDto { SubClauseId = 41, Status = "conforme", Score = 100, Comments = "OK" });

        created.Id.Should().Be(updated.Id);
        updated.Status.Should().Be("conforme");
        updated.Score.Should().Be(100);
        db.ConformityStatuses.Should().ContainSingle();
    }

    [Fact]
    public async Task GetGlobalStatsAsync_ShouldPreferCompanyConformityOverGlobalFallback()
    {
        await using var db = ClauseTestHelper.CreateDbContext();
        var parent = new IsoClause { Id = 4, Number = "4", Title = "Contexte" };
        var sub = new IsoClause { Id = 41, Number = "4.1", Title = "Contexte interne", ParentId = 4 };
        db.IsoClauses.AddRange(parent, sub);
        db.ConformityStatuses.AddRange(
            new ConformityStatus
            {
                IsoClauseId = 41,
                UserId = ClauseTestHelper.UserId,
                SocieteId = null,
                Status = "non-conforme",
                UpdatedAt = DateTime.UtcNow.AddDays(1)
            },
            new ConformityStatus
            {
                IsoClauseId = 41,
                UserId = ClauseTestHelper.UserId,
                SocieteId = ClauseTestHelper.SocieteId,
                Status = "conforme",
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            });
        await db.SaveChangesAsync();
        var service = new ClauseService(db);

        var stats = await service.GetGlobalStatsAsync(ClauseTestHelper.UserId, ClauseTestHelper.SocieteId);

        stats.TotalClauses.Should().Be(1);
        stats.ConformeClauses.Should().Be(1);
        stats.NonConformeClauses.Should().Be(0);
        stats.AverageConformity.Should().Be(100);
    }

    [Fact]
    public async Task UploadConformityProofFileAsync_ShouldRejectUnsupportedExtension()
    {
        await using var db = ClauseTestHelper.CreateDbContext();
        db.ConformityProofs.Add(new ConformityProof
        {
            Id = 9,
            IsoClauseId = 41,
            UserId = ClauseTestHelper.UserId,
            SocieteId = ClauseTestHelper.SocieteId
        });
        await db.SaveChangesAsync();
        var service = new ClauseService(db);

        var act = () => service.UploadConformityProofFileAsync(
            9,
            ClauseTestHelper.UserId,
            ClauseTestHelper.SocieteId,
            ClauseTestHelper.FormFile(fileName: "script.exe"),
            null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Extension non autoris*");
    }

    [Fact]
    public async Task UploadConformityProofFileAsync_ShouldStoreValidFile()
    {
        await using var db = ClauseTestHelper.CreateDbContext();
        db.ConformityProofs.Add(new ConformityProof
        {
            Id = 9,
            IsoClauseId = 41,
            UserId = ClauseTestHelper.UserId,
            SocieteId = ClauseTestHelper.SocieteId
        });
        await db.SaveChangesAsync();
        var service = new ClauseService(db);

        var result = await service.UploadConformityProofFileAsync(
            9,
            ClauseTestHelper.UserId,
            ClauseTestHelper.SocieteId,
            ClauseTestHelper.FormFile(content: "contenu"),
            "preuve");

        result.OriginalName.Should().Be("preuve.pdf");
        result.Description.Should().Be("preuve");
        db.FileAttachments.Should().ContainSingle(f =>
            f.ConformityProofId == 9 &&
            f.UserId == ClauseTestHelper.UserId &&
            f.Content.Length > 0);
    }
}
