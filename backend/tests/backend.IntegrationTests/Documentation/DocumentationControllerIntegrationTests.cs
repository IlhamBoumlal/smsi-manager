using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Application.Security;
using backend.IntegrationTests.Helpers;

namespace backend.IntegrationTests.Documentation;

public class DocumentationControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public DocumentationControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AdminSociete_CanListButCannotCreateDocument()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.AdminSociete,
            societeId: 1,
            ("documentation", PermissionCatalog.Actions.Read),
            ("documentation", PermissionCatalog.Actions.Create));

        var listResponse = await _client.GetAsync("/api/documentation");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        using var createForm = BuildDocumentationForm("Doc Admin Interdit");
        var createResponse = await _client.PostAsync("/api/documentation", createForm);
        Assert.Equal(HttpStatusCode.Forbidden, createResponse.StatusCode);
    }

    [Fact]
    public async Task Rssi_CanCreateUpdateApproveDownloadAndDeleteDocument()
    {
        await IntegrationTestAuthHelper.LoginAsRoleAsync(
            _factory,
            _client,
            AppRoles.Rssi,
            societeId: 1,
            ("documentation", PermissionCatalog.Actions.Read),
            ("documentation", PermissionCatalog.Actions.Create),
            ("documentation", PermissionCatalog.Actions.Edit),
            ("documentation", PermissionCatalog.Actions.Delete),
            ("documentation", PermissionCatalog.Actions.Approve),
            ("documentation", PermissionCatalog.Actions.Export));

        using var createForm = BuildDocumentationForm("Doc Integration RSSI");
        var createResponse = await _client.PostAsync("/api/documentation", createForm);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdBody = await createResponse.Content.ReadAsStringAsync();
        using var createdDoc = JsonDocument.Parse(createdBody);
        var id = createdDoc.RootElement.GetProperty("id").GetGuid();

        var getResponse = await _client.GetAsync($"/api/documentation/{id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        using var updateForm = BuildDocumentationForm("Doc Integration RSSI Updated");
        var updateResponse = await _client.PutAsync($"/api/documentation/{id}", updateForm);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var approveResponse = await _client.PostAsJsonAsync($"/api/documentation/{id}/approve", new
        {
            approver = "RSSI Integration"
        });
        Assert.Equal(HttpStatusCode.OK, approveResponse.StatusCode);

        var downloadResponse = await _client.GetAsync($"/api/documentation/{id}/download?format=pdf");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.StartsWith("application/pdf", downloadResponse.Content.Headers.ContentType?.MediaType);

        var deleteResponse = await _client.DeleteAsync($"/api/documentation/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    private static MultipartFormDataContent BuildDocumentationForm(string name)
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(name), "Name");
        form.Add(new StringContent("procedure"), "Type");
        form.Add(new StringContent("securite"), "Category");
        form.Add(new StringContent("brouillon"), "Status");
        form.Add(new StringContent("1.0"), "Version");
        form.Add(new StringContent("interne"), "Classification");
        form.Add(new StringContent("RSSI API Test"), "Author");
        form.Add(new StringContent("Document integration test"), "Description");
        return form;
    }
}
