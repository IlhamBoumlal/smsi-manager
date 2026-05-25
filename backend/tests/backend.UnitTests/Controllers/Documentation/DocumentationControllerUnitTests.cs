using System.Security.Claims;
using backend.API.Controllers;
using backend.Application.Documentation.Commands.CreateDocumentation;
using backend.Application.DTOs.Documentation;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Documentation;

public class DocumentationControllerUnitTests
{
    [Fact]
    public async Task Create_ShouldReturnForbid_WhenHandlerReturnsForbiddenError()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<CreateDocumentationCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, "FORBIDDEN:NO_ACCESS_SCOPE", (DocumentationResponseDto?)null));

        var environment = new Mock<IWebHostEnvironment>();
        var controller = new DocumentationController(mediator.Object, environment.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = CreatePrincipal("user-1", 1, "Admin Societe")
            }
        };

        var dto = new CreateDocumentationDto
        {
            Name = "Procedure Test",
            Type = "procedure",
            Category = "securite",
            Author = "Test"
        };

        var result = await controller.Create(dto, file: null);

        result.Should().BeOfType<ForbidResult>();
    }

    private static ClaimsPrincipal CreatePrincipal(string userId, int societeId, string role)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("SocieteId", societeId.ToString()),
            new Claim(ClaimTypes.Role, role),
        ], "TestAuth");

        return new ClaimsPrincipal(identity);
    }
}
