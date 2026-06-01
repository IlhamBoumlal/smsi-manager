using backend.API.Controllers;
using backend.Application.DTOs.Email;
using backend.Application.DTOs.Incident.backend.Application.Dtos;
using backend.Application.Incidents.Commands.CreateIncident;
using backend.Application.Incidents.Commands.DeleteIncident;
using backend.Application.Incidents.Commands.UpdateIncident;
using backend.Application.Incidents.Queries.GetAllIncidents;
using backend.Application.Incidents.Queries.GetIncidentById;
using backend.Domain.Entities;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Incidents;

public class IncidentsControllerTests
{
    [Fact]
    public async Task Create_ShouldSendCurrentSocieteAndReturnOkId()
    {
        var incidentId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<CreateIncidentCommand>(c =>
                    c.SocieteId == IncidentTestHelper.SocieteId &&
                    c.Incident.Titre == "Incident reseau"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(incidentId);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.Create(IncidentTestHelper.Dto());

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(incidentId);
    }

    [Fact]
    public async Task Update_ShouldSendRouteIdAndCurrentSociete()
    {
        var incidentId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateIncidentCommand>(c =>
                    c.Id == incidentId &&
                    c.SocieteId == IncidentTestHelper.SocieteId &&
                    c.Incident.Titre == "Incident maj"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.Update(incidentId, IncidentTestHelper.Dto("Incident maj"));

        result.Should().BeOfType<OkResult>();
    }

    [Fact]
    public async Task Update_ShouldReturnNotFound_WhenHandlerReturnsFalse()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<UpdateIncidentCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.Update(Guid.NewGuid(), IncidentTestHelper.Dto());

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_ShouldSendCurrentSocieteAndReturnOk()
    {
        var incidentId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<DeleteIncidentCommand>(c =>
                    c.Id == incidentId && c.SocieteId == IncidentTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.Delete(incidentId);

        result.Should().BeOfType<OkResult>();
    }

    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenMissing()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<DeleteIncidentCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetAll_ShouldSendCurrentSociete()
    {
        var incidents = new List<IncidentDto> { IncidentTestHelper.Dto() };
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetAllIncidentsQuery>(q => q.SocieteId == IncidentTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(incidents);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.GetAll();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(incidents);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenMissing()
    {
        var incidentId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetIncidentByIdQuery>(q =>
                    q.Id == incidentId && q.SocieteId == IncidentTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IncidentDto?)null);
        var controller = IncidentTestHelper.CreateController(mediator.Object);

        var result = await controller.GetById(incidentId);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task ImportFromEmail_ShouldRejectRequestWithoutJwtOrInternalKey()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        var controller = IncidentTestHelper.CreateController(new Mock<IMediator>().Object, db);
        controller.ControllerContext.HttpContext.User = new();

        var result = await controller.ImportFromEmail(new EmailImportDto { Subject = "Alerte SI" });

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task ImportFromEmail_ShouldCreateIncidentWithInternalKeyAndFirstSocieteFallback()
    {
        await using var db = IncidentTestHelper.CreateDbContext();
        db.Societes.Add(new Societe { Id = IncidentTestHelper.SocieteId, Nom = "SMSI Corp" });
        await db.SaveChangesAsync();
        var controller = IncidentTestHelper.CreateController(new Mock<IMediator>().Object, db);
        controller.ControllerContext.HttpContext.User = new();
        controller.Request.Headers["X-Internal-EmailImport-Key"] = "test-import-key";

        var result = await controller.ImportFromEmail(new EmailImportDto
        {
            From = "soc@example.test",
            Subject = "Alerte intrusion",
            Body = "Detection EDR",
            ReceivedAt = new DateTime(2026, 5, 23, 11, 0, 0, DateTimeKind.Utc)
        });

        result.Should().BeOfType<OkObjectResult>();
        var incident = db.Incidents.Should().ContainSingle().Subject;
        incident.Titre.Should().Be("Alerte intrusion");
        incident.SocieteId.Should().Be(IncidentTestHelper.SocieteId);
        incident.Description.Should().Contain("soc@example.test");
    }
}
