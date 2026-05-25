using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace backend.UnitTests.Helpers;

public static class GenerateTestJwt
{
    public static string Create(
        string userId = "test-user-id",
        string email = "test@example.com",
        string fullName = "Test User",
        string role = "Consultant",
        int? societeId = 1,
        string issuer = "smsi-tests",
        string audience = "smsi-tests-client",
        string key = "smsi-tests-signing-key-2026-with-strong-length",
        int expireMinutes = 60)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new("NomComplet", fullName),
            new(ClaimTypes.Role, role),
        };

        if (societeId.HasValue)
        {
            claims.Add(new Claim("SocieteId", societeId.Value.ToString()));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
