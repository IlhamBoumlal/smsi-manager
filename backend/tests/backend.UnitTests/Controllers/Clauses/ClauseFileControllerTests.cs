using Application.DTOs.Clause;
using backend.API.Controllers;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Services;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Clauses;

public class ClauseFileControllerTests
{
    [Fact]
    public async Task GetProofs_ShouldUseCurrentUserAndSociete()
    {
        var proofs = new List<ConformityProofDto>();
        var service = new Mock<IClauseService>();
        service.Setup(s => s.GetConformityProofsAsync(41, ClauseTestHelper.UserId, ClauseTestHelper.SocieteId))
            .ReturnsAsync(proofs);
        var controller = CreateController(service);

        var result = await controller.GetProofs(41);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(proofs);
    }

    [Fact]
    public async Task UploadProofFile_ShouldReturnBadRequest_WhenFileIsMissing()
    {
        var controller = CreateController(new Mock<IClauseService>());

        var result = await controller.UploadProofFile(7, null!);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.Value.Should().Be("Fichier manquant.");
    }

    [Fact]
    public async Task UploadProofFile_ShouldUploadAndTryDocumentationSync()
    {
        var file = ClauseTestHelper.FormFile();
        var uploaded = new FileAttachmentDto { Id = 5, OriginalName = "preuve.pdf" };
        var service = new Mock<IClauseService>();
        service.Setup(s => s.UploadConformityProofFileAsync(
                7, ClauseTestHelper.UserId, ClauseTestHelper.SocieteId, file, "preuve"))
            .ReturnsAsync(uploaded);
        var sync = new Mock<IDocumentationProofLinkService>();
        sync.Setup(s => s.FindOrCreateFromFormFileAndLinkAsync(
                file,
                ClauseTestHelper.UserId,
                null,
                null,
                null,
                "preuve",
                null,
                "clauses",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentationDocument { Id = Guid.NewGuid(), Name = "preuve.pdf" });
        var controller = CreateController(service, sync);

        var result = await controller.UploadProofFile(7, file, "preuve");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(uploaded);
        sync.VerifyAll();
    }

    [Fact]
    public async Task UploadPlanFile_ShouldReturnNotFound_WhenPlanIsMissing()
    {
        var planGuid = Guid.NewGuid();
        var file = ClauseTestHelper.FormFile();
        var service = new Mock<IClauseService>();
        service.Setup(s => s.UploadActionPlanFileAsync(
                planGuid, ClauseTestHelper.UserId, ClauseTestHelper.SocieteId, file, null))
            .ThrowsAsync(new KeyNotFoundException("Plan d'action introuvable."));
        var controller = CreateController(service);

        var result = await controller.UploadPlanFile(planGuid, file);

        var notFound = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFound.Value.Should().Be("Plan d'action introuvable.");
    }

    [Fact]
    public async Task Download_ShouldReturnFile_WhenServiceReturnsContent()
    {
        var service = new Mock<IClauseService>();
        service.Setup(s => s.DownloadFileAsync(5, ClauseTestHelper.UserId, ClauseTestHelper.SocieteId))
            .ReturnsAsync(("abc"u8.ToArray(), "text/plain", "preuve.txt"));
        var controller = CreateController(service);

        var result = await controller.Download(5);

        var file = result.Should().BeOfType<FileContentResult>().Subject;
        file.FileContents.Should().Equal("abc"u8.ToArray());
        file.ContentType.Should().Be("text/plain");
        file.FileDownloadName.Should().Be("preuve.txt");
    }

    private static ClauseFileController CreateController(
        Mock<IClauseService> service,
        Mock<IDocumentationProofLinkService>? sync = null)
    {
        sync ??= new Mock<IDocumentationProofLinkService>();

        return new ClauseFileController(service.Object, sync.Object).WithClauseUser();
    }
}
