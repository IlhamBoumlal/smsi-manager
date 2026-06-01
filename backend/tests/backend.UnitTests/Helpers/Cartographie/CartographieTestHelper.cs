using System.Security.Claims;
using System.Text;
using backend.API.Controllers;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Helpers;

public static class CartographieTestHelper
{
    public const int SocieteId = 77;
    public const int OtherSocieteId = 88;
    public const string UserId = "user-cartographie";

    public static ControllerContext ControllerContextWithUser(int societeId = SocieteId)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, UserId),
                new Claim("SocieteId", societeId.ToString())
            },
            authenticationType: "TestAuth"));

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    public static CartographieController WithCartographieUser(
        this CartographieController controller,
        int societeId = SocieteId)
    {
        controller.ControllerContext = ControllerContextWithUser(societeId);
        return controller;
    }

    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static Processus CreateProcessus(
        string nom = "Gestion des risques",
        int? societeId = SocieteId)
        => Processus.Create(
            "mgmt",
            nom,
            "RSSI",
            "Description processus",
            societeId);

    public static IFormFile FormFile(
        string fileName = "procedure.pdf",
        string contentType = "application/pdf",
        string content = "procedure")
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "fichier", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
