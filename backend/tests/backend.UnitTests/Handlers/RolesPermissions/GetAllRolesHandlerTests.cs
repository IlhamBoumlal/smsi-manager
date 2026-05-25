using backend.Application.Roles.Queries.GetAllRoles;
using backend.Domain.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace backend.UnitTests.Handlers.RolesPermissions;

public class GetAllRolesHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnRoles_FromRepository()
    {
        var roleRepository = new Mock<IRoleRepository>();
        roleRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(
        [
            new IdentityRole("Admin Societe"),
            new IdentityRole("RSSI")
        ]);

        var handler = new GetAllRolesHandler(roleRepository.Object);
        var result = await handler.Handle(new GetAllRolesQuery(), CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(r => r.Name).Should().Contain(["Admin Societe", "RSSI"]);
    }
}
