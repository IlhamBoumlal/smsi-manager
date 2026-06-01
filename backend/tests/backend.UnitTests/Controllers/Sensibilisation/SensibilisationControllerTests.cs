using backend.API.Controllers;
using backend.Application.DTOs;
using backend.Application.Sensibilisation.Commands.CreateFormation;
using backend.Application.Sensibilisation.Commands.DeleteFormation;
using backend.Application.Sensibilisation.Commands.NotifyParticipants;
using backend.Application.Sensibilisation.Commands.UpdateFormation;
using backend.Application.Sensibilisation.Commands.UpdateParticipantStatus;
using backend.Application.Sensibilisation.Queries.GetDashboard;
using backend.Application.Sensibilisation.Queries.GetFormationDetail;
using backend.Application.Sensibilisation.Queries.GetFormations;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Sensibilisation;

public class SensibilisationControllerTests
{
    [Fact]
    public async Task GetDashboard_ShouldSendCurrentSociete()
    {
        var expected = new DashboardSensibilisationDto { Total = 3 };
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetSensibilisationDashboardQuery>(q => q.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var controller = CreateController(mediator);

        var result = await controller.GetDashboard(CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task GetAll_ShouldSendCurrentSociete()
    {
        var expected = new List<FormationListDto> { new() { Title = "Phishing" } };
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetFormationsQuery>(q => q.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var controller = CreateController(mediator);

        var result = await controller.GetAll(CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenMissing()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetFormationDetailQuery>(q =>
                    q.Id == id && q.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((FormationDetailDto?)null);
        var controller = CreateController(mediator);

        var result = await controller.GetById(id, CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_ShouldOverrideBodySocieteAndReturnCreatedAtAction()
    {
        var formationId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<CreateFormationCommand>(c =>
                    c.Title == "Sensibilisation ISO" &&
                    c.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(formationId);
        var controller = CreateController(mediator);

        var result = await controller.Create(CreateCommand("Sensibilisation ISO") with { SocieteId = 999 }, CancellationToken.None);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(SensibilisationController.GetById));
        created.RouteValues!["id"].Should().Be(formationId);
    }

    [Fact]
    public async Task Update_ShouldReturnBadRequest_WhenRouteAndBodyIdsDiffer()
    {
        var controller = CreateController(new Mock<IMediator>());

        var result = await controller.Update(Guid.NewGuid(), UpdateCommand(Guid.NewGuid()), CancellationToken.None);

        result.Should().BeOfType<BadRequestResult>();
    }

    [Fact]
    public async Task Update_ShouldSendCurrentSocieteAndReturnNoContent()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateFormationCommand>(c =>
                    c.Id == id && c.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = CreateController(mediator);

        var result = await controller.Update(id, UpdateCommand(id) with { SocieteId = 999 }, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Notify_ShouldUseDefaultTitleAndCurrentSociete()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<NotifyParticipantsCommand>(c =>
                    c.FormationId == id &&
                    c.NotifTitle == "Notification envoyée" &&
                    c.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = CreateController(mediator);

        var result = await controller.Notify(id, new NotifyRequest(null), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task UpdateParticipantStatus_ShouldSendRouteIdsStatusAndCurrentSociete()
    {
        var formationId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateParticipantStatusCommand>(c =>
                    c.FormationId == formationId &&
                    c.ParticipantId == participantId &&
                    c.Status == "Présent" &&
                    c.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = CreateController(mediator);

        var result = await controller.UpdateParticipantStatus(
            formationId,
            participantId,
            new ParticipantStatusRequest("Présent"),
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenHandlerReturnsFalse()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<DeleteFormationCommand>(c =>
                    c.Id == id && c.SocieteId == SensibilisationTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var controller = CreateController(mediator);

        var result = await controller.Delete(id, CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    private static SensibilisationController CreateController(Mock<IMediator> mediator)
        => new SensibilisationController(mediator.Object).WithSensibilisationUser();

    private static CreateFormationCommand CreateCommand(string title) => new(
        title,
        "Description",
        "Objectif",
        "Présentiel",
        "2026-06-01",
        "09:00",
        "2h",
        "RSSI",
        "Interne",
        "IT",
        "Collaborateur",
        null,
        false,
        false,
        new List<ParticipantInput>(),
        null);

    private static UpdateFormationCommand UpdateCommand(Guid id) => new(
        id,
        "Titre maj",
        "Description",
        "Objectif",
        "Distanciel",
        "2026-06-02",
        "10:00",
        "3h",
        "RSSI",
        "Interne",
        "IT",
        "Collaborateur",
        null,
        null);
}
