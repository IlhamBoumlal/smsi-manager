using System.Text;
using Application.DTOs.Clause;
using backend.Infrastructure.Data;
using backend.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.IntegrationTests.Clauses;

public class ClauseServiceIntegrationTests
{
    private const string UserId = "integration-user";
    private const int SocieteId = 33;

    [Fact]
    public async Task Service_ShouldSeedClausesAndComputeDashboardFromConformity()
    {
        await using var context = CreateContext();
        var service = new ClauseService(context);

        await service.SeedClausesAsync();
        var parentClause = await context.IsoClauses
            .Include(c => c.SubClauses)
            .SingleAsync(c => c.Number == "4");
        var subClause = parentClause.SubClauses.Single(c => c.Number == "4.1");

        await service.UpsertConformityAsync(
            subClause.Id,
            UserId,
            SocieteId,
            new UpsertConformityDto
            {
                SubClauseId = subClause.Id,
                Status = "conforme",
                Score = 100,
                Comments = "Preuve validee"
            });

        var dashboard = await service.GetDashboardAsync(UserId, SocieteId);
        var stats = await service.GetGlobalStatsAsync(UserId, SocieteId);

        var clause4 = Assert.Single(dashboard, d => d.Clause.Number == "4");
        Assert.Equal(4, clause4.TotalSubClauses);
        Assert.Equal(25, clause4.ComputedScore);
        Assert.False(clause4.IsFullyCompliant);
        Assert.True(clause4.SubConformities.ContainsKey(subClause.Id));
        Assert.Equal(7, stats.TotalClauses);
        Assert.Equal(1, stats.ConformeClauses);
    }

    [Fact]
    public async Task Service_ShouldCreateUpdateAndDeleteActionPlan()
    {
        await using var context = CreateContext();
        var service = new ClauseService(context);
        await service.SeedClausesAsync();
        var clause = await context.IsoClauses.SingleAsync(c => c.Number == "6");
        var subClause = await context.IsoClauses.SingleAsync(c => c.Number == "6.1");

        var created = await service.CreateActionPlanAsync(
            UserId,
            SocieteId,
            new CreateActionPlanDto
            {
                IsoClauseId = clause.Id,
                SubClauseId = subClause.Id,
                Reference = "PA-CLAUSE-001",
                DateDetection = "2026-05-21",
                ClauseIso = "6.1",
                DescriptionNc = "Action corrective initiale",
                Statut = "en-cours"
            });

        var updated = await service.UpdateActionPlanAsync(
            created.Id,
            UserId,
            SocieteId,
            new UpdateActionPlanDto
            {
                IsoClauseId = clause.Id,
                SubClauseId = subClause.Id,
                Reference = "PA-CLAUSE-001",
                DateDetection = "2026-05-21",
                ClauseIso = "6.1",
                DescriptionNc = "Action corrective mise a jour",
                Statut = "terminee"
            });
        var plansBeforeDelete = await service.GetActionPlansAsync(clause.Id, UserId, SocieteId);
        var deleted = await service.DeleteActionPlanAsync(created.Id, UserId, SocieteId);
        var plansAfterDelete = await service.GetActionPlansAsync(clause.Id, UserId, SocieteId);

        Assert.NotEqual(Guid.Empty, created.GuidId);
        Assert.NotNull(updated);
        Assert.Equal("terminee", updated!.Statut);
        Assert.Single(plansBeforeDelete);
        Assert.True(deleted);
        Assert.Empty(plansAfterDelete);
    }

    [Fact]
    public async Task Service_ShouldUploadDownloadAndDeleteConformityProofFile()
    {
        await using var context = CreateContext();
        var service = new ClauseService(context);
        await service.SeedClausesAsync();
        var subClause = await context.IsoClauses.SingleAsync(c => c.Number == "7.5");
        var proof = await service.UpsertConformityProofAsync(
            subClause.Id,
            UserId,
            SocieteId,
            new UpsertConformityProofDto
            {
                IsoClauseId = subClause.Id,
                Description = "Document approuve"
            });

        var uploaded = await service.UploadConformityProofFileAsync(
            proof.Id,
            UserId,
            SocieteId,
            CreateFormFile("politique.pdf", "application/pdf", "contenu politique"),
            "Politique SMSI");
        var downloaded = await service.DownloadFileAsync(uploaded.Id, UserId, SocieteId);
        var deleted = await service.DeleteConformityProofFileAsync(uploaded.Id, UserId, SocieteId);
        var downloadedAfterDelete = await service.DownloadFileAsync(uploaded.Id, UserId, SocieteId);

        Assert.Equal("politique.pdf", uploaded.OriginalName);
        Assert.NotNull(downloaded);
        Assert.Equal("politique.pdf", downloaded!.Value.fileName);
        Assert.Equal("contenu politique", Encoding.UTF8.GetString(downloaded.Value.content));
        Assert.True(deleted);
        Assert.Null(downloadedAfterDelete);
    }

    [Fact]
    public async Task Service_ShouldIsolateProofsBySociete()
    {
        await using var context = CreateContext();
        var service = new ClauseService(context);
        await service.SeedClausesAsync();
        var subClause = await context.IsoClauses.SingleAsync(c => c.Number == "8.1");

        await service.UpsertConformityProofAsync(
            subClause.Id,
            UserId,
            SocieteId,
            new UpsertConformityProofDto { IsoClauseId = subClause.Id, Description = "Societe 33" });
        await service.UpsertConformityProofAsync(
            subClause.Id,
            UserId,
            44,
            new UpsertConformityProofDto { IsoClauseId = subClause.Id, Description = "Societe 44" });

        var proofsForSociete33 = await service.GetConformityProofsAsync(subClause.Id, UserId, SocieteId);
        var proofsForSociete44 = await service.GetConformityProofsAsync(subClause.Id, UserId, 44);

        var proof33 = Assert.Single(proofsForSociete33);
        var proof44 = Assert.Single(proofsForSociete44);
        Assert.Equal("Societe 33", proof33.Description);
        Assert.Equal("Societe 44", proof44.Description);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static IFormFile CreateFormFile(string fileName, string contentType, string content)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
