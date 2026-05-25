using System.Net;
using System.Text.Json;
using backend.Application.Security;
using backend.Domain.Entities;
using backend.IntegrationTests.Helpers;
using backend.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace backend.IntegrationTests.Tracabilite;

public class TracabiliteControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TracabiliteControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AdminSociete_CanListWithFilters_AndExportCsv()
    {
        var login = await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("tracabilite", PermissionCatalog.Actions.Read),
            ("tracabilite", PermissionCatalog.Actions.Export));

        await SeedLogsAsync(login.User.Id, societeId: 1);

        var listResponse = await _client.GetAsync("/api/tracabilite?page=1&pageSize=25&module=roles&action=create");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var listBody = await listResponse.Content.ReadAsStringAsync();
        using var listDoc = JsonDocument.Parse(listBody);
        var total = listDoc.RootElement.GetProperty("total").GetInt32();
        var items = listDoc.RootElement.GetProperty("items");

        Assert.Equal(1, total);
        Assert.Equal(1, items.GetArrayLength());

        var exportResponse = await _client.GetAsync("/api/tracabilite/export?module=roles&action=create");
        Assert.Equal(HttpStatusCode.OK, exportResponse.StatusCode);
        Assert.Contains("text/csv", exportResponse.Content.Headers.ContentType?.ToString());

        var csv = await exportResponse.Content.ReadAsStringAsync();
        Assert.Contains("DateUTC,Utilisateur,Email,Role,Module,Action", csv);
    }

    [Fact]
    public async Task Rssi_IsForbidden_OnTenantAdminTraceRoutes()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.Rssi,
            societeId: 1,
            ("tracabilite", PermissionCatalog.Actions.Read));

        var response = await _client.GetAsync("/api/tracabilite?page=1&pageSize=25");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task SeedLogsAsync(string userId, int societeId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.UserActivityLogs.AddRange(
            new UserActivityLog
            {
                SocieteId = societeId,
                UserId = userId,
                UserFullName = "Admin Societe",
                UserEmail = "admin@smsi.local",
                UserRole = AppRoles.AdminSociete,
                ModuleCode = "roles",
                ActionCode = PermissionCatalog.Actions.Create,
                HttpMethod = "POST",
                Path = "/api/role/tenant",
                StatusCode = 200,
                Description = "Role cree",
                CreatedAt = DateTime.UtcNow.AddMinutes(-2)
            },
            new UserActivityLog
            {
                SocieteId = societeId,
                UserId = userId,
                UserFullName = "Admin Societe",
                UserEmail = "admin@smsi.local",
                UserRole = AppRoles.AdminSociete,
                ModuleCode = "roles",
                ActionCode = PermissionCatalog.Actions.Read,
                HttpMethod = "GET",
                Path = "/api/role/tenant",
                StatusCode = 200,
                Description = "Role liste",
                CreatedAt = DateTime.UtcNow.AddMinutes(-1)
            },
            new UserActivityLog
            {
                SocieteId = societeId,
                UserId = userId,
                UserFullName = "Admin Societe",
                UserEmail = "admin@smsi.local",
                UserRole = AppRoles.SuperAdmin,
                ModuleCode = "roles",
                ActionCode = PermissionCatalog.Actions.Create,
                HttpMethod = "POST",
                Path = "/api/role/tenant",
                StatusCode = 200,
                Description = "Role cree super admin",
                CreatedAt = DateTime.UtcNow
            });

        await db.SaveChangesAsync();
    }
}
