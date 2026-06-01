using System.Security.Claims;
using backend.API.Controllers;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.UnitTests.Helpers;

public static class ActifTestHelper
{
    public const int SocieteId = 61;
    public const int OtherSocieteId = 62;
    public const string UserId = "user-actifs";

    public static ActifsController WithActifUser(this ActifsController controller, int societeId = SocieteId)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, UserId),
                new Claim("SocieteId", societeId.ToString())
            },
            "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    public static Actif Actif(
        Guid? id = null,
        string nom = "Serveur applicatif",
        int? societeId = SocieteId) => new()
    {
        Id = id ?? Guid.NewGuid(),
        Nom = nom,
        Description = "Serveur hebergeant l'application SMSI",
        Type = TypeActif.Support,
        Categorie = CategorieActif.Infrastructure,
        Classification = ClassificationActif.Confidentiel,
        ProprietaireNom = "Equipe IT",
        SocieteId = societeId
    };
}
