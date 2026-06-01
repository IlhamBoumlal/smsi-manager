using System.Security.Claims;
using System.Text;
using backend.API.Controllers;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Helpers;

public static class ClauseTestHelper
{
    public const string UserId = "user-clauses";
    public const int SocieteId = 17;

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

    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static IFormFile FormFile(
        string fileName = "preuve.pdf",
        string contentType = "application/pdf",
        string content = "preuve de conformite")
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    public static T WithClauseUser<T>(this T controller)
        where T : ControllerBase
    {
        controller.ControllerContext = ControllerContextWithUser();
        return controller;
    }
}
