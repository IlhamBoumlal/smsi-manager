using backend.Application.Security;
using FluentAssertions;

namespace backend.UnitTests.Services.RolesPermissions;

public class PermissionCatalogTests
{
    [Theory]
    [InlineData("dashboard", "dashboard")]
    [InlineData("tableau de bord", "dashboard")]
    [InlineData("tableau-bord", "dashboard")]
    [InlineData("roles", "roles")]
    [InlineData("documentation", "documentation")]
    [InlineData("risques", "risques")]
    [InlineData("tracabilite", "tracabilite")]
    [InlineData("traceabilite", "tracabilite")]
    [InlineData("historiQue", "tracabilite")]
    public void CanonicalizeModule_ShouldReturnCanonicalCode(string input, string expected)
    {
        PermissionCatalog.CanonicalizeModule(input).Should().Be(expected);
    }

    [Theory]
    [InlineData("lecture", PermissionCatalog.Actions.Read)]
    [InlineData("view", PermissionCatalog.Actions.Read)]
    [InlineData("utiliser", PermissionCatalog.Actions.Use)]
    [InlineData("use", PermissionCatalog.Actions.Use)]
    [InlineData("create", PermissionCatalog.Actions.Create)]
    [InlineData("write", PermissionCatalog.Actions.Create)]
    [InlineData("update", PermissionCatalog.Actions.Edit)]
    [InlineData("modify", PermissionCatalog.Actions.Edit)]
    [InlineData("delete", PermissionCatalog.Actions.Delete)]
    [InlineData("remove", PermissionCatalog.Actions.Delete)]
    [InlineData("export", PermissionCatalog.Actions.Export)]
    [InlineData("approve", PermissionCatalog.Actions.Approve)]
    [InlineData("admin", PermissionCatalog.Actions.Administer)]
    public void CanonicalizeAction_ShouldReturnCanonicalCode(string input, string expected)
    {
        PermissionCatalog.Actions.Canonicalize(input).Should().Be(expected);
    }

    [Theory]
    [InlineData("GET", PermissionCatalog.Actions.Read)]
    [InlineData("POST", PermissionCatalog.Actions.Create)]
    [InlineData("PUT", PermissionCatalog.Actions.Edit)]
    [InlineData("PATCH", PermissionCatalog.Actions.Edit)]
    [InlineData("DELETE", PermissionCatalog.Actions.Delete)]
    public void FromHttpMethod_ShouldMapExpectedAction(string httpMethod, string expectedAction)
    {
        PermissionCatalog.Actions.FromHttpMethod(httpMethod).Should().Be(expectedAction);
    }

    [Fact]
    public void ModuleScopes_ShouldMatchTargetModules()
    {
        PermissionCatalog.IsSmsiModule("dashboard").Should().BeTrue();
        PermissionCatalog.IsSmsiModule("documentation").Should().BeTrue();
        PermissionCatalog.IsSmsiModule("risques").Should().BeTrue();
        PermissionCatalog.IsSmsiModule("tracabilite").Should().BeTrue();

        PermissionCatalog.IsPlatformModule("dashboard").Should().BeFalse();
        PermissionCatalog.IsPlatformModule("societes").Should().BeTrue();
    }
}
