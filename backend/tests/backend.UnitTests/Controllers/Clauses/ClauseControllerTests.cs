using Application.DTOs.Clause;
using backend.API.Controllers;
using backend.Infrastructure.Services;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace backend.UnitTests.Controllers.Clauses;

public class ClauseControllerTests
{
    [Fact]
    public async Task GetClauses_ShouldSeedThenReturnClauses()
    {
        var clauses = new List<IsoClauseDto>
        {
            new() { Id = 1, Number = "4", Title = "Contexte" }
        };
        var service = new Mock<IClauseService>();
        service.Setup(s => s.GetClausesAsync()).ReturnsAsync(clauses);
        var controller = new ClauseController(service.Object).WithClauseUser();

        var result = await controller.GetClauses();

        service.Verify(s => s.SeedClausesAsync(), Times.Once);
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(clauses);
    }

    [Fact]
    public async Task GetClause_ShouldReturnNotFound_WhenMissing()
    {
        var service = new Mock<IClauseService>();
        service.Setup(s => s.GetClauseAsync(404)).ReturnsAsync((IsoClauseDto?)null);
        var controller = new ClauseController(service.Object).WithClauseUser();

        var result = await controller.GetClause(404);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetDashboard_ShouldUseCurrentUserAndSociete()
    {
        var dashboard = new List<ClauseDashboardDto>();
        var service = new Mock<IClauseService>();
        service.Setup(s => s.GetDashboardAsync(ClauseTestHelper.UserId, ClauseTestHelper.SocieteId))
            .ReturnsAsync(dashboard);
        var controller = new ClauseController(service.Object).WithClauseUser();

        var result = await controller.GetDashboard();

        service.Verify(s => s.SeedClausesAsync(), Times.Once);
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(dashboard);
    }

    [Fact]
    public async Task CreateConformity_ShouldUpsertForCurrentUserAndSociete()
    {
        var dto = new UpsertConformityDto { SubClauseId = 41, Status = "conforme", Score = 100 };
        var expected = new ConformityStatusDto { IsoClauseId = 41, Status = "conforme", Score = 100 };
        var service = new Mock<IClauseService>();
        service.Setup(s => s.UpsertConformityAsync(41, ClauseTestHelper.UserId, ClauseTestHelper.SocieteId, dto))
            .ReturnsAsync(expected);
        var controller = new ClauseController(service.Object).WithClauseUser();

        var result = await controller.CreateConformity(dto);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task CreateActionPlan_ShouldReturnCreatedAtAction()
    {
        var dto = new CreateActionPlanDto { IsoClauseId = 4, Reference = "PA-001" };
        var created = new ActionPlanDto { Id = 123, IsoClauseId = 4, Reference = "PA-001" };
        var service = new Mock<IClauseService>();
        service.Setup(s => s.CreateActionPlanAsync(ClauseTestHelper.UserId, ClauseTestHelper.SocieteId, dto))
            .ReturnsAsync(created);
        var controller = new ClauseController(service.Object).WithClauseUser();

        var result = await controller.CreateActionPlan(dto);

        var response = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        response.ActionName.Should().Be(nameof(ClauseController.GetActionPlan));
        response.RouteValues!["id"].Should().Be(123);
        response.Value.Should().BeSameAs(created);
    }

    [Fact]
    public async Task DeleteActionPlan_ShouldReturnNoContent_WhenDeleted()
    {
        var service = new Mock<IClauseService>();
        service.Setup(s => s.DeleteActionPlanAsync(123, ClauseTestHelper.UserId, ClauseTestHelper.SocieteId))
            .ReturnsAsync(true);
        var controller = new ClauseController(service.Object).WithClauseUser();

        var result = await controller.DeleteActionPlan(123);

        result.Should().BeOfType<NoContentResult>();
    }
}
