using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Domain.Interfaces;
using backend.Infrastructure.Services;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace backend.UnitTests.Services;

public class JwtTokenServiceTests
{
    private const string JwtKey = "UnitTest_JwtKey_ChangeMe_12345678901234567890";
    private const string Issuer = "smsi-manager-tests";
    private const string Audience = "smsi-manager-client-tests";

    [Fact]
    public async Task GenerateToken_ShouldIncludeIdentitySocieteAndRoleClaims()
    {
        var user = AuthTestHelper.User();
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.GetRolesAsync(user)).ReturnsAsync(["AdminSociete", "RSSI"]);
        var service = new JwtTokenService(userRepo.Object, CreateConfiguration());

        var token = await service.GenerateTokenAsync(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Issuer.Should().Be(Issuer);
        jwt.Audiences.Should().Contain(Audience);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == AuthTestHelper.UserId);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == AuthTestHelper.Email);
        jwt.Claims.Should().Contain(c => c.Type == "NomComplet" && c.Value == AuthTestHelper.NomComplet);
        jwt.Claims.Should().Contain(c => c.Type == "SocieteId" && c.Value == AuthTestHelper.SocieteId.ToString());
        jwt.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value)
            .Should()
            .BeEquivalentTo("AdminSociete", "RSSI");
    }

    [Fact]
    public async Task GenerateToken_ShouldCreateTokenValidWithConfiguredSigningKey()
    {
        var user = AuthTestHelper.User();
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.GetRolesAsync(user)).ReturnsAsync(["AdminSociete"]);
        var service = new JwtTokenService(userRepo.Object, CreateConfiguration());
        var token = await service.GenerateTokenAsync(user);
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(5)
        };

        var principal = new JwtSecurityTokenHandler().ValidateToken(token, validationParameters, out var securityToken);

        securityToken.Should().BeOfType<JwtSecurityToken>();
        principal.FindFirst(ClaimTypes.Email)!.Value.Should().Be(AuthTestHelper.Email);
        principal.FindFirst("SocieteId")!.Value.Should().Be(AuthTestHelper.SocieteId.ToString());
    }

    private static IConfiguration CreateConfiguration() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = JwtKey,
                ["Jwt:Issuer"] = Issuer,
                ["Jwt:Audience"] = Audience,
                ["Jwt:ExpireMinutes"] = "30"
            })
            .Build();
}
