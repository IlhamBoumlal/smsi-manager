using System.Net;
using System.Net.Http.Json;
using backend.Application.Security;
using backend.IntegrationTests.Helpers;

namespace backend.IntegrationTests.Dashboard;

public class DashboardControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public DashboardControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AdminSociete_CanReadGlobalAndSnapshots()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("dashboard", PermissionCatalog.Actions.Read));

        var globalResponse = await _client.GetAsync("/api/dashboard/global");
        Assert.Equal(HttpStatusCode.OK, globalResponse.StatusCode);

        var snapshotsResponse = await _client.GetAsync("/api/dashboard/snapshots?months=6");
        Assert.Equal(HttpStatusCode.OK, snapshotsResponse.StatusCode);
    }

    [Fact]
    public async Task AdminSociete_CannotWriteDashboardSnapshots_EvenIfWritePermissionsAreAssigned()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("dashboard", PermissionCatalog.Actions.Create),
            ("dashboard", PermissionCatalog.Actions.Delete));

        var upsertResponse = await _client.PostAsJsonAsync("/api/dashboard/snapshots/upsert", new
        {
            monthStartUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            globalConformity = 72,
            incidentsCount = 4,
            auditsCompleted = 2,
            pdcaCompleted = 3
        });

        Assert.Equal(HttpStatusCode.Forbidden, upsertResponse.StatusCode);

        var deleteResponse = await _client.DeleteAsync($"/api/dashboard/snapshots/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Consultant_WithoutDashboardReadPermission_StillCanAccessGlobal()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.Consultant,
            societeId: 1);

        var response = await _client.GetAsync("/api/dashboard/global");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
