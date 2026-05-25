using System.Security.Claims;
using backend.API.Controllers;
using backend.Infrastructure.Data;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace backend.UnitTests.Controllers.Dashboard;

public class DashboardControllerUnitTests
{
    [Fact]
    public async Task GetSnapshots_ShouldReturnForbid_WhenSocieteClaimIsMissing()
    {
        await using var db = CreateDbContext();
        var mediator = new Mock<IMediator>();
        var controller = new DashboardController(mediator.Object, db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await controller.GetSnapshots();

        result.Should().BeOfType<ForbidResult>();
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"DashboardControllerUnitTests_{Guid.NewGuid():N}")
            .Options;

        return new AppDbContext(options);
    }
}
