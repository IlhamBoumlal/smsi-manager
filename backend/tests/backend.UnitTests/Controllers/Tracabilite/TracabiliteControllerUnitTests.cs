using backend.API.Controllers;
using backend.Infrastructure.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Controllers.Tracabilite;

public class TracabiliteControllerUnitTests
{
    [Fact]
    public async Task GetLogs_ShouldReturnForbid_WhenSocieteClaimIsMissing()
    {
        await using var db = CreateDbContext();
        var controller = new TracabiliteController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var result = await controller.GetLogs(new TracabiliteQuery(), CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TracabiliteControllerUnitTests_{Guid.NewGuid():N}")
            .Options;

        return new AppDbContext(options);
    }
}
