using Application.Cartographie.Commands;
using Application.Cartographie.Queries;
using Application.DTOs.Cartographie;
using backend.API.Controllers;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Cartographie;

public class CartographieControllerTests
{
    [Fact]
    public async Task GetAll_ShouldSendCurrentSociete()
    {
        var expected = new List<ProcessusDto>();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetAllProcessusQuery>(q => q.SocieteId == CartographieTestHelper.SocieteId),
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
                It.Is<GetProcessusByIdQuery>(q =>
                    q.Id == id && q.SocieteId == CartographieTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ProcessusDto?)null);
        var controller = CreateController(mediator);

        var result = await controller.GetById(id, CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_ShouldOverrideBodySocieteAndReturnCreatedAtAction()
    {
        var created = ProcessusDto(Guid.NewGuid(), "Processus cartographie");
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<CreateProcessusCommand>(c =>
                    c.Nom == "Processus cartographie" &&
                    c.SocieteId == CartographieTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);
        var controller = CreateController(mediator);

        var result = await controller.Create(
            new CreateProcessusCommand("mgmt", "Processus cartographie", "RSSI", "Description", [], 999),
            CancellationToken.None);

        var response = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        response.ActionName.Should().Be(nameof(CartographieController.GetById));
        response.RouteValues!["id"].Should().Be(created.Id);
        response.Value.Should().BeSameAs(created);
    }

    [Fact]
    public async Task Update_ShouldSendRouteIdCurrentSocieteAndCurrentUser()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateProcessusCommand>(c =>
                    c.Id == id &&
                    c.Nom == "Nom maj" &&
                    c.SocieteId == CartographieTestHelper.SocieteId &&
                    c.CurrentUserId == CartographieTestHelper.UserId),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.Update(
            id,
            new UpdateProcessusBody("real", "Nom maj", "Owner", "Desc", ["4.1 - Contexte"]),
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_ShouldSendCurrentSocieteAndCurrentUser()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<DeleteProcessusCommand>(c =>
                    c.Id == id &&
                    c.SocieteId == CartographieTestHelper.SocieteId &&
                    c.CurrentUserId == CartographieTestHelper.UserId),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.Delete(id, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task AddClause_ShouldSendAssociationCommand()
    {
        var processusId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<AddClauseToProcessusCommand>(c =>
                    c.ProcessusId == processusId &&
                    c.ClauseId == 41 &&
                    c.SocieteId == CartographieTestHelper.SocieteId &&
                    c.Justification == "Applicable"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.AddClause(processusId, new AddClauseBody(41, "Applicable"), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task AddControle_ShouldSendAssociationCommand()
    {
        var processusId = Guid.NewGuid();
        var controleId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<AddControleToProcessusCommand>(c =>
                    c.ProcessusId == processusId &&
                    c.ControleId == controleId &&
                    c.SocieteId == CartographieTestHelper.SocieteId &&
                    c.Justification == "Controle cle"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var controller = CreateController(mediator);

        var result = await controller.AddControle(processusId, new AddControleBody(controleId, "Controle cle"), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task AddDocument_ShouldReadFileAndSendCommand()
    {
        var processusId = Guid.NewGuid();
        var expected = new DocumentDto(Guid.NewGuid(), "Procedure", "procedure", "REF-1", "valide", "procedure.pdf", "application/pdf", true);
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<AddDocumentCommand>(c =>
                    c.ProcessusId == processusId &&
                    c.Nom == "Procedure" &&
                    c.Reference == "REF-1" &&
                    c.FichierNom == "procedure.pdf" &&
                    c.FichierType == "application/pdf" &&
                    c.FichierData != null &&
                    c.FichierData.Length > 0 &&
                    c.SocieteId == CartographieTestHelper.SocieteId &&
                    c.CurrentUserId == CartographieTestHelper.UserId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var controller = CreateController(mediator);

        var result = await controller.AddDocument(
            processusId,
            new AddDocumentBody("Procedure", "procedure", "REF-1", "valide"),
            CartographieTestHelper.FormFile(),
            CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task DownloadFichier_ShouldReturnNotFound_WhenMissingFileData()
    {
        var documentId = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetDocumentFichierQuery>(q =>
                    q.DocumentId == documentId && q.SocieteId == CartographieTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((DocumentFichierDto?)null);
        var controller = CreateController(mediator);

        var result = await controller.DownloadFichier(documentId, CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    private static CartographieController CreateController(Mock<IMediator> mediator)
        => new CartographieController(mediator.Object).WithCartographieUser();

    private static ProcessusDto ProcessusDto(Guid id, string nom) => new(
        id,
        "mgmt",
        nom,
        "RSSI",
        "Description",
        [],
        []);
}
