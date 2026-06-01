using System.Security.Claims;
using backend.API.Controllers;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Helpers;

public static class AuditTestHelper
{
    public const string UserId = "user-audits";
    public const int SocieteId = 33;
    public const int OtherSocieteId = 44;

    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static ControllerContext ControllerContextWithUser(
        string userId = UserId,
        int societeId = SocieteId)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("SocieteId", societeId.ToString())
            },
            authenticationType: "TestAuth"));

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    public static AuditsController CreateController(AppDbContext db, int societeId = SocieteId)
        => new(db)
        {
            ControllerContext = ControllerContextWithUser(societeId: societeId)
        };
}
