using backend.Application.Security;
using FluentAssertions;

namespace backend.UnitTests.Handlers.Tracabilite;

public class TracabiliteModuleAliasTests
{
    [Fact]
    public void CanonicalizeModule_ShouldMapHistorique_ToTracabilite()
    {
        var moduleCode = PermissionCatalog.CanonicalizeModule("historique");
        moduleCode.Should().Be("tracabilite");
    }

    [Fact]
    public void CanonicalizeAction_ShouldMapLecture_ToRead()
    {
        var actionCode = PermissionCatalog.Actions.Canonicalize("lecture");
        actionCode.Should().Be(PermissionCatalog.Actions.Read);
    }
}
