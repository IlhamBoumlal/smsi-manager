using System.Security.Claims;
using backend.API.Controllers;
using backend.Application.Auth.Commands.Login;
using backend.Application.Auth.Queries;
using backend.Application.DTOs.Authentification;
using backend.UnitTests.Helpers;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Auth;

public class AuthControllerTests
{
    [Fact]
    public async Task Login_ShouldReturnOk_WhenCredentialsAreValid()
    {
        var response = new AuthResponseDto(
            "jwt-token",
            AuthTestHelper.NomComplet,
            AuthTestHelper.Email,
            new SocieteInfoDto(AuthTestHelper.SocieteId, "Societe SMSI", "logo.png"));
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<LoginCommand>(c => c.Email == AuthTestHelper.Email && c.Password == "Password123!"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, null, response));
        var controller = new AuthController(mediator.Object);

        var result = await controller.Login(new LoginDto(AuthTestHelper.Email, "Password123!"));

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<LoginCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, "Identifiants incorrects.", null));
        var controller = new AuthController(mediator.Object);

        var result = await controller.Login(new LoginDto(AuthTestHelper.Email, "wrong"));

        var unauthorized = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorized.Value.Should().Be("Identifiants incorrects.");
    }

    [Fact]
    public async Task CheckUserStatus_ShouldSendCurrentUserId()
    {
        var status = new UserStatusDto { IsActive = true, Email = AuthTestHelper.Email };
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(
                It.Is<CheckUserStatusQuery>(q => q.UserId == AuthTestHelper.UserId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(status);
        var controller = new AuthController(mediator.Object).WithAuthUser();

        var result = await controller.CheckUserStatus();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(status);
    }

    [Fact]
    public async Task CheckUserStatus_ShouldReturnUnauthorized_WhenNameIdentifierClaimIsMissing()
    {
        var controller = new AuthController(new Mock<IMediator>().Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([], "TestAuth"))
            }
        };

        var result = await controller.CheckUserStatus();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public void GetMe_ShouldReturnClaimsFromCurrentToken()
    {
        var controller = new AuthController(new Mock<IMediator>().Object).WithAuthUser();

        var result = controller.GetMe();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
        ok.Value!.GetType().GetProperty("id")!.GetValue(ok.Value).Should().Be(AuthTestHelper.UserId);
        ok.Value.GetType().GetProperty("email")!.GetValue(ok.Value).Should().Be(AuthTestHelper.Email);
        ok.Value.GetType().GetProperty("nomComplet")!.GetValue(ok.Value).Should().Be(AuthTestHelper.NomComplet);
        ok.Value.GetType().GetProperty("societeId")!.GetValue(ok.Value).Should().Be(AuthTestHelper.SocieteId.ToString());
    }

    [Theory]
    [InlineData(nameof(AuthController.CheckUserStatus))]
    [InlineData(nameof(AuthController.GetMe))]
    public void AuthenticatedEndpoints_ShouldBeProtectedWithAuthorize(string actionName)
    {
        var method = typeof(AuthController).GetMethod(actionName)!;

        method.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Should()
            .NotBeEmpty();
    }

    [Fact]
    public void Register_ShouldRequirePlatformScope()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Register))!;

        method.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .Should()
            .ContainSingle(a => a.Policy == "PlatformScope");
    }
}
