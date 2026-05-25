using backend.API.Controllers;
using backend.Application.Permissions.Commands.AssignPermission;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.RolesPermissions;

public class PermissionControllerUnitTests
{
    [Fact]
    public async Task GrantPermission_ShouldReturnBadRequest_WhenMediatorReturnsFailure()
    {
        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<GrantPermissionCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GrantPermissionResult
            {
                Success = false,
                Message = "Permission introuvable"
            });

        var controller = new PermissionController(mediator.Object);

        var result = await controller.GrantPermission("role-1", new PermissionRequestDto
        {
            ModuleId = "module-1",
            ActionId = "action-1"
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
