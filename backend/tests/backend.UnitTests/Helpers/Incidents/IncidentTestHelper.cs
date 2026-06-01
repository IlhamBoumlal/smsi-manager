using System.Security.Claims;
using backend.API.Controllers;
using backend.API.Hubs;
using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.DTOs.Settings;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace backend.UnitTests.Helpers;

public static class IncidentTestHelper
{
    public const int SocieteId = 71;
    public const int OtherSocieteId = 72;
    public const string UserId = "user-incidents";

    public static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static IncidentsController CreateController(
        IMediator mediator,
        AppDbContext? context = null,
        int societeId = SocieteId,
        string? internalImportKey = "test-import-key")
    {
        var controller = new IncidentsController(
            mediator,
            NullLogger<IncidentsController>.Instance,
            context ?? CreateDbContext(),
            CreateHubContextMock().Object,
            Options.Create(new EmailMonitoringSettings { InternalImportKey = internalImportKey ?? string.Empty }));

        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, UserId),
                new Claim("SocieteId", societeId.ToString())
            },
            "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    public static Mock<IHubContext<NotificationHub>> CreateHubContextMock()
    {
        var clientProxy = new Mock<IClientProxy>();
        clientProxy.Setup(p => p.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var clients = new Mock<IHubClients>();
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(clientProxy.Object);
        clients.Setup(c => c.User(It.IsAny<string>())).Returns(clientProxy.Object);

        var hubContext = new Mock<IHubContext<NotificationHub>>();
        hubContext.Setup(h => h.Clients).Returns(clients.Object);

        return hubContext;
    }

    public static Incident Incident(
        Guid? id = null,
        string titre = "Incident reseau",
        int? societeId = SocieteId,
        StatutIncident statut = StatutIncident.EnCours) => new()
    {
        Id = id ?? Guid.NewGuid(),
        Titre = titre,
        Description = "Perte de connectivite",
        Date = new DateTime(2026, 5, 23, 10, 0, 0, DateTimeKind.Utc),
        Priorite = PrioriteIncident.HAUTE,
        Statut = statut,
        Resolution = statut == StatutIncident.Resolu ? "Incident corrige" : null,
        SocieteId = societeId
    };

    public static IncidentDto Dto(
        string titre = "Incident reseau",
        StatutIncident statut = StatutIncident.EnCours) => new()
    {
        Titre = titre,
        Description = "Perte de connectivite",
        Priorite = PrioriteIncident.HAUTE,
        Statut = statut,
        Resolution = statut == StatutIncident.Resolu ? "Incident corrige" : null
    };
}
