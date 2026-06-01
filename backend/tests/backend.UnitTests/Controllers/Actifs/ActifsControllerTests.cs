using backend.API.Controllers;
using backend.Application.Actifs.Commands.CreateActif;
using backend.Application.Actifs.Commands.DeleteActif;
using backend.Application.Actifs.Commands.UpdateActif;
using backend.Application.Actifs.Queries.GetActifById;
using backend.Application.Actifs.Queries.GetAllActifs;
using backend.Application.DTOs.ActifDTOs;
using backend.Domain.Enumerations;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Actifs;

public class ActifsControllerTests
{
    [Fact]
    public async Task GetAll_ShouldSendCurrentSociete()
    {
        var expected = new List<ActifResponseDto>
        {
            Response(Guid.NewGuid(), "Serveur applicatif")
        };
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetAllActifsQuery>(q => q.SocieteId == ActifTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.GetAll();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenMissing()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetActifByIdQuery>(q => q.Id == id && q.SocieteId == ActifTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ActifResponseDto?)null);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.GetById(id);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetById_ShouldReturnOk_WhenFound()
    {
        var id = Guid.NewGuid();
        var response = Response(id, "Serveur applicatif");
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetActifByIdQuery>(q => q.Id == id && q.SocieteId == ActifTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.GetById(id);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task Create_ShouldOverrideBodySocieteAndReturnCreatedAtAction()
    {
        var createdId = Guid.NewGuid();
        var command = new CreateActifCommand(
            "Poste RSSI",
            "Poste de travail",
            TypeActif.Support,
            CategorieActif.EquipementInformatique,
            ClassificationActif.Confidentiel,
            "RSSI",
            ActifTestHelper.OtherSocieteId);
        var response = Response(createdId, command.Nom);
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<CreateActifCommand>(c =>
                    c.Nom == command.Nom &&
                    c.SocieteId == ActifTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.Create(command);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be(nameof(ActifsController.GetById));
        created.RouteValues!["id"].Should().Be(createdId);
        created.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task Update_ShouldOverrideRouteIdAndBodySociete()
    {
        var routeId = Guid.NewGuid();
        var bodyId = Guid.NewGuid();
        var command = new UpdateActifCommand(
            bodyId,
            "Application SMSI",
            "Application critique",
            TypeActif.Primaire,
            CategorieActif.Application,
            ClassificationActif.Secret,
            "Metier",
            ActifTestHelper.OtherSocieteId);
        var response = Response(routeId, command.Nom);
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateActifCommand>(c =>
                    c.Id == routeId &&
                    c.SocieteId == ActifTestHelper.SocieteId &&
                    c.Nom == command.Nom),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.Update(routeId, command);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task Update_ShouldReturnNotFound_WhenHandlerReturnsNull()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<UpdateActifCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ActifResponseDto?)null);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.Update(id, UpdateCommand(id));

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_ShouldSendCurrentSocieteAndReturnNoContent()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<DeleteActifCommand>(c => c.Id == id && c.SocieteId == ActifTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.Delete(id);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenMissing()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<DeleteActifCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var controller = new ActifsController(mediator.Object).WithActifUser();

        var result = await controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    private static UpdateActifCommand UpdateCommand(Guid id) => new(
        id,
        "Application SMSI",
        "Application critique",
        TypeActif.Primaire,
        CategorieActif.Application,
        ClassificationActif.Secret,
        "Metier",
        ActifTestHelper.SocieteId);

    private static ActifResponseDto Response(Guid id, string nom) => new(
        id,
        nom,
        "Description",
        TypeActif.Support,
        CategorieActif.Infrastructure,
        ClassificationActif.Confidentiel,
        "Equipe IT");
}
