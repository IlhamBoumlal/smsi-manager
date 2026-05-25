using backend.API.Controllers;
using backend.Domain.Interfaces;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Risques;

public class RisquesControllerUnitTests
{
    [Fact]
    public async Task GetOwners_ShouldReturnForbid_WhenUserScopeIsMissing()
    {
        var mediator = new Mock<IMediator>();
        var userRepository = new Mock<IUserRepository>();
        var controller = new RisquesController(mediator.Object, userRepository.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var result = await controller.GetOwners();

        result.Should().BeOfType<ForbidResult>();
        userRepository.Verify(r => r.GetActiveBySocieteAsync(It.IsAny<int>()), Times.Never);
    }
}
