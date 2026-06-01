using System.Security.Claims;
using backend.API.Controllers;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Helpers;

public static class SensibilisationTestHelper
{
    public const int SocieteId = 55;
    public const int OtherSocieteId = 66;
    public const string UserId = "user-sensibilisation";

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

    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static SensibilisationController WithSensibilisationUser(
        this SensibilisationController controller,
        int societeId = SocieteId)
    {
        controller.ControllerContext = ControllerContextWithUser(societeId);
        return controller;
    }

    public static Formation CreateFormation(
        string title = "Sensibilisation phishing",
        int? societeId = SocieteId,
        DateTime? dateDebut = null)
        => Formation.Create(
            title,
            "Description formation",
            "Objectif formation",
            FormationMode.Presentiel,
            dateDebut ?? new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc),
            "2h",
            "RSSI",
            FormateurType.Interne,
            "IT",
            "Collaborateur",
            null,
            notifInvit: false,
            notifRappel: false,
            societeId);
}
