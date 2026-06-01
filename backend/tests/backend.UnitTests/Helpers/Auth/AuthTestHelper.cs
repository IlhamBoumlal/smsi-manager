using System.Security.Claims;
using backend.API.Controllers;
using backend.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.UnitTests.Helpers;

public static class AuthTestHelper
{
    public const string UserId = "auth-user-id";
    public const string Email = "ilham@smsi.test";
    public const string NomComplet = "Ilham Auth";
    public const int SocieteId = 42;

    public static ApplicationUser User(bool isActive = true) => new()
    {
        Id = UserId,
        UserName = Email,
        Email = Email,
        NomComplet = NomComplet,
        SocieteId = SocieteId,
        IsActive = isActive,
        Societe = new Societe
        {
            Id = SocieteId,
            Nom = "Societe SMSI",
            Logo = "logo.png"
        }
    };

    public static AuthController WithAuthUser(this AuthController controller)
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, UserId),
                new Claim(ClaimTypes.Email, Email),
                new Claim("NomComplet", NomComplet),
                new Claim("SocieteId", SocieteId.ToString())
            },
            "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }
}
