using System.Security.Claims;
using backend.API.Controllers;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Helpers;

public static class ControleTestHelper
{
    public const int SocieteId = 91;
    public const int OtherSocieteId = 92;
    public const string UserId = "user-controles";
    public const string UserName = "User Controles";

    public static ControllerContext ControllerContextWithUser(int societeId = SocieteId)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, UserId),
                new Claim("SocieteId", societeId.ToString()),
                new Claim("NomComplet", UserName)
            },
            authenticationType: "TestAuth"));

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    public static ControlesController WithControleUser(
        this ControlesController controller,
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

    public static Controle Controle(
        string code = "A.5.1",
        string titre = "Politiques de securite",
        int? societeId = SocieteId)
        => new()
        {
            Id = Guid.NewGuid(),
            Code = code,
            Titre = titre,
            Description = "Description controle",
            Domaine = DomaineControle.Organisationnel,
            SocieteId = societeId,
            Applicable = true,
            Statut = Statut.NonEvalue
        };
}
