using backend.Application.Security;
using FluentAssertions;

namespace backend.UnitTests.Services.RolesPermissions;

public class AppRolesTests
{
    [Fact]
    public void ToPrimaryRoleKey_ShouldReturnExpectedKey()
    {
        AppRoles.ToPrimaryRoleKey(AppRoles.SuperAdmin, null).Should().Be(AppRoles.SuperAdminRoleKey);
        AppRoles.ToPrimaryRoleKey(AppRoles.AdminSociete, 1).Should().Be(AppRoles.AdminSocieteRoleKey);
        AppRoles.ToPrimaryRoleKey(AppRoles.Rssi, 1).Should().Be(AppRoles.RssiRoleKey);
        AppRoles.ToPrimaryRoleKey(AppRoles.Consultant, 1).Should().Be(AppRoles.ConsultantRoleKey);
        AppRoles.ToPrimaryRoleKey(AppRoles.Auditeur, 1).Should().Be(AppRoles.AuditeurRoleKey);
    }

    [Fact]
    public void TenantCustomRole_RoundTrip_ShouldWork()
    {
        var roleName = AppRoles.BuildTenantCustomRoleName(10, "Role Projet X");

        var ok = AppRoles.TryParseTenantCustomRoleName(roleName, out var societeId, out var displayName);

        ok.Should().BeTrue();
        societeId.Should().Be(10);
        displayName.Should().Be("Role Projet X");
    }
}