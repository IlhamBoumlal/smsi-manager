using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.UnitTests.Helpers;

public static class PdcaControllerTestHelper
{
    public const int SocieteId = 42;

    public static ControllerContext ControllerContextWithSociete(int societeId = SocieteId)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim("SocieteId", societeId.ToString()) },
            authenticationType: "TestAuth"));

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }
}
