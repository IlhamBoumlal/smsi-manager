using Application.DTOs;
using Application.PDCA.Commands.AddItem;
using Application.PDCA.Commands.AddSection;
using Application.PDCA.Commands.CreateCycle;
using Application.PDCA.Commands.DeleteItem;
using Application.PDCA.Commands.DeleteSection;
using Application.PDCA.Commands.RenameSection;
using Application.PDCA.Commands.UpdateItem;
using Application.PDCA.Queries.GetCycleById;
using Application.PDCA.Queries.GetCycles;
using backend.API.Controllers;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Pdca;

public class PdcaControllerTests
{
    [Fact]
    public async Task GetCycles_ShouldReturnCyclesForCurrentSociete()
    {
        var expected = new List<CycleSummaryDto>
        {
            new(Guid.NewGuid(), "Cycle SMSI", true, DateTime.UtcNow)
        };
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetCyclesQuery>(q => q.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var controller = CreateController(mediator);

        var result = await controller.GetCycles(CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task GetCycle_ShouldReturnNotFound_WhenCycleDoesNotExist()
    {
        var cycleId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetCycleByIdQuery>(q =>
                    q.Id == cycleId && q.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CycleDetailDto?)null);
        var controller = CreateController(mediator);

        var result = await controller.GetCycle(cycleId, CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateCycle_ShouldSendCurrentSocieteAndReturnCreatedAtAction()
    {
        var cycleId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<CreateCycleCommand>(c =>
                    c.Name == "Cycle PDCA 2026" && c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cycleId);
        var controller = CreateController(mediator);

        var result = await controller.CreateCycle(new CreateCycleBody("Cycle PDCA 2026"), CancellationToken.None);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(PdcaController.GetCycle));
        created.RouteValues!["id"].Should().Be(cycleId);
    }

    [Fact]
    public async Task AddSection_ShouldOverrideBodySocieteWithCurrentSociete()
    {
        var phaseId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<AddSectionCommand>(c =>
                    c.PhaseId == phaseId &&
                    c.Title == "Planification" &&
                    c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(sectionId);
        var controller = CreateController(mediator);

        var result = await controller.AddSection(
            new AddSectionCommand(phaseId, "Planification", SocieteId: 999),
            CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task RenameSection_ShouldSendRouteIdAndCurrentSociete()
    {
        var sectionId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<RenameSectionCommand>(c =>
                    c.SectionId == sectionId &&
                    c.NewTitle == "Section renommee" &&
                    c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.RenameSection(sectionId, new RenameSectionBody("Section renommee"), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteSection_ShouldSendRouteIdAndCurrentSociete()
    {
        var sectionId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<DeleteSectionCommand>(c =>
                    c.SectionId == sectionId && c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.DeleteSection(sectionId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task AddItem_ShouldOverrideBodySocieteWithCurrentSociete()
    {
        var sectionId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<AddItemCommand>(c =>
                    c.SectionId == sectionId &&
                    c.Text == "Realiser l'action" &&
                    c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(itemId);
        var controller = CreateController(mediator);

        var result = await controller.AddItem(
            new AddItemCommand(sectionId, "Realiser l'action", SocieteId: 999),
            CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateItem_ShouldSendRouteIdBodyFieldsAndCurrentSociete()
    {
        var itemId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateItemCommand>(c =>
                    c.Id == itemId &&
                    c.Status == "done" &&
                    c.Text == "Action terminee" &&
                    c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.UpdateItem(
            itemId,
            new UpdateItemBody(Status: "done", Text: "Action terminee"),
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteItem_ShouldSendRouteIdAndCurrentSociete()
    {
        var itemId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<DeleteItemCommand>(c =>
                    c.Id == itemId && c.SocieteId == PdcaControllerTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.DeleteItem(itemId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    private static PdcaController CreateController(Mock<IMediator> mediator)
        => new(mediator.Object)
        {
            ControllerContext = PdcaControllerTestHelper.ControllerContextWithSociete()
        };
}
