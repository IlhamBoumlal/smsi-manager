using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Application.Security;
using backend.IntegrationTests.Helpers;

namespace backend.IntegrationTests.Risques;

public class RisquesControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RisquesControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Rssi_CanCreateUpdateDuplicateAndDeleteRiskStudy()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.Rssi,
            societeId: 1,
            ("risques", PermissionCatalog.Actions.Read),
            ("risques", PermissionCatalog.Actions.Create),
            ("risques", PermissionCatalog.Actions.Edit),
            ("risques", PermissionCatalog.Actions.Delete));

        var ownersResponse = await _client.GetAsync("/api/risques/studies/owners");
        Assert.Equal(HttpStatusCode.OK, ownersResponse.StatusCode);

        var createResponse = await _client.PostAsJsonAsync("/api/risques/studies", new
        {
            name = "Etude risques integration",
            organization = "Org test",
            description = "Description integration",
            perimeter = "Perimetre test",
            author = "RSSI Integration",
            payloadJson = "{\"workshops\":[]}"
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdId = await ExtractIdAsync(createResponse);

        var getResponse = await _client.GetAsync($"/api/risques/studies/{createdId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var updateResponse = await _client.PutAsJsonAsync($"/api/risques/studies/{createdId}", new
        {
            name = "Etude risques integration updated",
            organization = "Org test",
            description = "Description integration updated",
            perimeter = "Perimetre test",
            author = "RSSI Integration",
            payloadJson = "{\"workshops\":[{\"id\":1}]}"
        });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var duplicateResponse = await _client.PostAsync($"/api/risques/studies/{createdId}/duplicate", null);
        Assert.Equal(HttpStatusCode.Created, duplicateResponse.StatusCode);
        var duplicatedId = await ExtractIdAsync(duplicateResponse);

        var deleteDuplicateResponse = await _client.DeleteAsync($"/api/risques/studies/{duplicatedId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteDuplicateResponse.StatusCode);

        var deleteOriginalResponse = await _client.DeleteAsync($"/api/risques/studies/{createdId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteOriginalResponse.StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_IsForbidden_OnTenantRisquesRoutes()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.SuperAdmin,
            societeId: null,
            ("risques", PermissionCatalog.Actions.Read));

        var response = await _client.GetAsync("/api/risques/studies");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static async Task<Guid> ExtractIdAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty("id").GetGuid();
    }
}
