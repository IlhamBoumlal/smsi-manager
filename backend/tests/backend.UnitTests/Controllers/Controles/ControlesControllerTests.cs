using System.Text;
using System.Text.Json;
using backend.API.Controllers;
using backend.Application.Controles.Commands.UpdateControle;
using backend.Application.Controles.Queries.GetAllControles;
using backend.Application.Controles.Queries.GetControleById;
using backend.Application.DTOs.Controles;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Controles;

public class ControlesControllerTests
{
    [Fact]
    public async Task GetAll_ShouldSendCurrentSociete()
    {
        var expected = new List<ControleDto>();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<GetAllControlesQuery>(q => q.SocieteId == ControleTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var controller = CreateController(mediator, new Mock<IDocumentationProofLinkService>());

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
                It.Is<GetControleByIdQuery>(q =>
                    q.Id == id && q.SocieteId == ControleTestHelper.SocieteId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ControleDto?)null);
        var controller = CreateController(mediator, new Mock<IDocumentationProofLinkService>());

        var result = await controller.GetById(id);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Update_ShouldInjectRouteSocieteAndCurrentModifier()
    {
        var id = Guid.NewGuid();
        var dto = ControleDto(id, "A.5.1", "Titre maj");
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateControleCommand>(c =>
                    c.Id == id &&
                    c.SocieteId == ControleTestHelper.SocieteId &&
                    c.ModifierId == ControleTestHelper.UserId &&
                    c.ModifierNom == ControleTestHelper.UserName),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, null, dto));
        var controller = CreateController(mediator, new Mock<IDocumentationProofLinkService>());

        var result = await controller.Update(id, UpdateCommand(Guid.NewGuid()), CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(dto);
    }

    [Fact]
    public async Task Update_ShouldKeepProvidedModifier()
    {
        var id = Guid.NewGuid();
        var dto = ControleDto(id, "A.5.1", "Titre maj");
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<UpdateControleCommand>(c =>
                    c.ModifierId == "explicit-user" &&
                    c.ModifierNom == "Explicit User"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, null, dto));
        var controller = CreateController(mediator, new Mock<IDocumentationProofLinkService>());

        var result = await controller.Update(
            id,
            UpdateCommand(id) with { ModifierId = "explicit-user", ModifierNom = "Explicit User" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Update_ShouldReturnBadRequest_WhenHandlerFails()
    {
        var id = Guid.NewGuid();
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<UpdateControleCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, "Controle introuvable", null));
        var controller = CreateController(mediator, new Mock<IDocumentationProofLinkService>());

        var result = await controller.Update(id, UpdateCommand(id), CancellationToken.None);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.Value.Should().Be("Controle introuvable");
    }

    [Fact]
    public async Task Update_ShouldSyncValidProofPayloadToDocumentation()
    {
        var id = Guid.NewGuid();
        var proofBytes = Encoding.UTF8.GetBytes("preuve");
        var preuvesJson = JsonSerializer.Serialize(new[]
        {
            new { name = "preuve.pdf", data = Convert.ToBase64String(proofBytes) }
        });
        var dto = ControleDto(id, "A.8.3", "Gestion des mots de passe");
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<UpdateControleCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, null, dto));
        var proofSync = new Mock<IDocumentationProofLinkService>();
        proofSync.Setup(s => s.FindOrCreateFromBytesAndLinkAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentationDocument());
        var controller = CreateController(mediator, proofSync);

        var result = await controller.Update(
            id,
            UpdateCommand(id) with
            {
                Preuves = preuvesJson,
                Remarque = "Preuve analysee"
            },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        proofSync.Verify(s => s.FindOrCreateFromBytesAndLinkAsync(
            It.Is<byte[]>(bytes => bytes.SequenceEqual(proofBytes)),
            "preuve.pdf",
            null,
            ControleTestHelper.UserId,
            null,
            "A.8.3",
            null,
            "Preuve analysee",
            null,
            "controle",
            "Organisationnel",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    private static ControlesController CreateController(
        Mock<IMediator> mediator,
        Mock<IDocumentationProofLinkService> proofSync)
        => new ControlesController(mediator.Object, proofSync.Object).WithControleUser();

    private static UpdateControleCommand UpdateCommand(Guid id) => new(
        id,
        "Titre maj",
        "Description maj",
        DomaineControle.Organisationnel,
        true,
        Statut.Conforme,
        ["legale"],
        null,
        "Justifie",
        null,
        null);

    private static ControleDto ControleDto(Guid id, string code, string titre) => new()
    {
        Id = id,
        Code = code,
        Titre = titre,
        Domaine = DomaineControle.Organisationnel,
        Applicable = true,
        Statut = Statut.Conforme
    };
}
