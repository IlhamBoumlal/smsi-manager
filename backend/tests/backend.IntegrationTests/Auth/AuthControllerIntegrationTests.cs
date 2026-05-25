using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Application.Security;

namespace backend.IntegrationTests.Auth;

public sealed class AuthControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsJwtToken()
    {
        var seeded = await _factory.SeedUserAsync(
            roleName: AppRoles.Consultant,
            societeId: 1);

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = seeded.User.Email!,
            Password = seeded.Password
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(authResponse);
        Assert.False(string.IsNullOrWhiteSpace(authResponse!.Token));
        Assert.Equal(seeded.User.Email, authResponse.Email);
    }

    [Fact]
    public async Task Me_WithBearerToken_ReturnsCurrentUser()
    {
        var seeded = await _factory.SeedUserAsync(
            roleName: AppRoles.Consultant,
            societeId: 1);

        var login = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = seeded.User.Email!,
            Password = seeded.Password
        });

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var authResponse = await login.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        Assert.NotNull(authResponse);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var meResponse = await _client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var me = await meResponse.Content.ReadFromJsonAsync<MeResponse>(JsonOptions);
        Assert.NotNull(me);
        Assert.Equal(seeded.User.Email, me!.Email);
        Assert.Equal(seeded.User.NomComplet, me.NomComplet);
        Assert.Equal("1", me.SocieteId);
    }

    private sealed class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    private sealed class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string NomComplet { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    private sealed class MeResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NomComplet { get; set; } = string.Empty;
        public string? SocieteId { get; set; }
    }
}
