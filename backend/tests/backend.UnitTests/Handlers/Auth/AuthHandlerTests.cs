using backend.Application.Auth.Commands.Login;
using backend.Application.Auth.Queries;
using backend.Domain.Interfaces;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace backend.UnitTests.Handlers.Auth;

public class AuthHandlerTests
{
    [Fact]
    public async Task Login_ShouldReturnTokenAndSociete_WhenCredentialsAreValid()
    {
        var user = AuthTestHelper.User();
        var userRepo = new Mock<IUserRepository>();
        var jwtService = new Mock<IJwtTokenService>();
        userRepo.Setup(r => r.GetByEmailAsync(AuthTestHelper.Email)).ReturnsAsync(user);
        userRepo.Setup(r => r.CheckPasswordAsync(user, "Password123!")).ReturnsAsync(SignInResult.Success);
        jwtService.Setup(s => s.GenerateTokenAsync(user)).ReturnsAsync("jwt-token");
        var handler = new LoginHandler(userRepo.Object, jwtService.Object);

        var result = await handler.Handle(new LoginCommand($"  {AuthTestHelper.Email}  ", "Password123!"), CancellationToken.None);

        result.Item1.Should().BeTrue();
        result.Item2.Should().BeNull();
        result.Item3.Should().NotBeNull();
        result.Item3!.Token.Should().Be("jwt-token");
        result.Item3.Email.Should().Be(AuthTestHelper.Email);
        result.Item3.NomComplet.Should().Be(AuthTestHelper.NomComplet);
        result.Item3.Societe!.Id.Should().Be(AuthTestHelper.SocieteId);
        userRepo.Verify(r => r.GetByEmailAsync(AuthTestHelper.Email), Times.Once);
    }

    [Theory]
    [InlineData("", "Password123!")]
    [InlineData("ilham@smsi.test", "")]
    public async Task Login_ShouldRejectEmptyCredentials(string email, string password)
    {
        var handler = new LoginHandler(new Mock<IUserRepository>().Object, new Mock<IJwtTokenService>().Object);

        var result = await handler.Handle(new LoginCommand(email, password), CancellationToken.None);

        result.Item1.Should().BeFalse();
        result.Item2.Should().Be("Identifiants incorrects.");
        result.Item3.Should().BeNull();
    }

    [Fact]
    public async Task Login_ShouldRejectUnknownUser()
    {
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.GetByEmailAsync(AuthTestHelper.Email)).ReturnsAsync((ApplicationUser?)null);
        var handler = new LoginHandler(userRepo.Object, new Mock<IJwtTokenService>().Object);

        var result = await handler.Handle(new LoginCommand(AuthTestHelper.Email, "Password123!"), CancellationToken.None);

        result.Item1.Should().BeFalse();
        result.Item2.Should().Be("Identifiants incorrects.");
    }

    [Fact]
    public async Task Login_ShouldRejectInactiveUser()
    {
        var user = AuthTestHelper.User(isActive: false);
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.GetByEmailAsync(AuthTestHelper.Email)).ReturnsAsync(user);
        var handler = new LoginHandler(userRepo.Object, new Mock<IJwtTokenService>().Object);

        var result = await handler.Handle(new LoginCommand(AuthTestHelper.Email, "Password123!"), CancellationToken.None);

        result.Item1.Should().BeFalse();
        result.Item2.Should().Contain("désactivé");
    }

    [Fact]
    public async Task Login_ShouldRejectInvalidPassword()
    {
        var user = AuthTestHelper.User();
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.GetByEmailAsync(AuthTestHelper.Email)).ReturnsAsync(user);
        userRepo.Setup(r => r.CheckPasswordAsync(user, "wrong")).ReturnsAsync(SignInResult.Failed);
        var handler = new LoginHandler(userRepo.Object, new Mock<IJwtTokenService>().Object);

        var result = await handler.Handle(new LoginCommand(AuthTestHelper.Email, "wrong"), CancellationToken.None);

        result.Item1.Should().BeFalse();
        result.Item2.Should().Be("Identifiants incorrects.");
    }

    [Fact]
    public async Task CheckUserStatus_ShouldReturnInactive_WhenUserDoesNotExist()
    {
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.GetByIdAsync(AuthTestHelper.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);
        var handler = new CheckUserStatusHandler(userRepo.Object);

        var result = await handler.Handle(new CheckUserStatusQuery(AuthTestHelper.UserId), CancellationToken.None);

        result.IsActive.Should().BeFalse();
        result.Email.Should().BeEmpty();
    }
}
