using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Application.Security;
using backend.IntegrationTests.Helpers;

namespace backend.IntegrationTests.RolesPermissions;

public class RoleControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RoleControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AdminSociete_CanAccess_TenantRoles()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("roles", PermissionCatalog.Actions.Read));

        var response = await _client.GetAsync("/api/role/tenant");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Consultant_CannotAccess_TenantRoles()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.Consultant,
            societeId: 1);

        var response = await _client.GetAsync("/api/role/tenant");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminSociete_CanCreateUpdate_CustomTenantRole()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("roles", PermissionCatalog.Actions.Create),
            ("roles", PermissionCatalog.Actions.Edit));

        var createdName = $"Role test {Guid.NewGuid():N}";
        var createResponse = await _client.PostAsJsonAsync("/api/role/tenant", new { nom = createdName });
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var createdJson = await createResponse.Content.ReadAsStringAsync();
        using var createdDoc = JsonDocument.Parse(createdJson);
        var roleId = createdDoc.RootElement.GetProperty("id").GetString();
        Assert.False(string.IsNullOrWhiteSpace(roleId));

        var updatedName = $"{createdName} updated";
        var updateResponse = await _client.PutAsJsonAsync($"/api/role/tenant/{roleId}", new { nom = updatedName });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
    }

    [Fact]
    public async Task AdminSociete_CreateTenantRole_WithDuplicateName_ReturnsConflict()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("roles", PermissionCatalog.Actions.Create));

        var duplicatedName = $"Role duplicate {Guid.NewGuid():N}";

        var createFirst = await _client.PostAsJsonAsync("/api/role/tenant", new { nom = duplicatedName });
        Assert.Equal(HttpStatusCode.OK, createFirst.StatusCode);

        var createSecond = await _client.PostAsJsonAsync("/api/role/tenant", new { nom = duplicatedName });
        Assert.Equal(HttpStatusCode.Conflict, createSecond.StatusCode);
    }
}
