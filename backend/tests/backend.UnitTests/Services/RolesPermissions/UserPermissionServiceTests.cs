using backend.Application.Security;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using backend.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Action = backend.Domain.Entities.Action;

namespace backend.UnitTests.Services.RolesPermissions;

public class UserPermissionServiceTests
{
    [Fact]
    public async Task HasPermissionAsync_ShouldReturnTrue_WhenPermissionIsGrantedForSameSociete()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.AdminSociete, 1);
        await GrantPermissionAsync(db, role, "dashboard", PermissionCatalog.Actions.Read);

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: 1,
            moduleCode: "tableau-bord",
            actionCode: "lecture");

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task HasPermissionAsync_ShouldReturnFalse_WhenSocieteDoesNotMatch()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.AdminSociete, 1);
        await GrantPermissionAsync(db, role, "dashboard", PermissionCatalog.Actions.Read);

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: 2,
            moduleCode: "dashboard",
            actionCode: "read");

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task HasPermissionAsync_ShouldReturnTrue_WhenAdministerIsGranted()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.AdminSociete, 1);
        await GrantPermissionAsync(db, role, "dashboard", PermissionCatalog.Actions.Administer);

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: 1,
            moduleCode: "dashboard",
            actionCode: "read");

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task HasPermissionAsync_ShouldReturnFalse_ForDashboardCreate_EvenWhenGranted()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.AdminSociete, 1);
        await GrantPermissionAsync(db, role, "dashboard", PermissionCatalog.Actions.Create);

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: 1,
            moduleCode: "dashboard",
            actionCode: "create");

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task HasPermissionAsync_ShouldReturnFalse_ForPlatformModule_WhenRoleIsNotSuperAdmin()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.AdminSociete, 1);
        await GrantPermissionAsync(db, role, "societes", PermissionCatalog.Actions.Read);

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: 1,
            moduleCode: "societes",
            actionCode: "read");

        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task HasPermissionAsync_ShouldReturnTrue_ForPlatformModule_WhenRoleIsSuperAdmin()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.SuperAdmin, null);
        await GrantPermissionAsync(db, role, "societes", PermissionCatalog.Actions.Read);

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: null,
            moduleCode: "societes",
            actionCode: "read");

        allowed.Should().BeTrue();
    }

    [Fact]
    public async Task GetEffectivePermissionsAsync_ShouldReturnCanonicalModuleAndActionCodes()
    {
        await using var db = CreateDbContext();
        var (user, role) = await SeedUserWithRoleAsync(db, AppRoles.AdminSociete, 1);
        await GrantPermissionAsync(db, role, "tableau de bord", "lecture");

        var service = new UserPermissionService(db);
        var result = await service.GetEffectivePermissionsAsync(user.Id);

        result.UserId.Should().Be(user.Id);
        result.Modules.Should().ContainSingle();
        result.Modules[0].ModuleCode.Should().Be("dashboard");
        result.Modules[0].Actions.Should().ContainSingle();
        result.Modules[0].Actions[0].ActionCode.Should().Be("read");
    }

    [Fact]
    public async Task HasPermissionAsync_ShouldAlwaysGrantDashboardRead_ForTenantUsers()
    {
        await using var db = CreateDbContext();
        var (user, _role) = await SeedUserWithRoleAsync(db, AppRoles.Consultant, 1);
        db.Modules.Add(new Module
        {
            Id = Guid.NewGuid().ToString(),
            Code = "dashboard",
            Name = "Dashboard"
        });
        db.Actions.Add(new Action
        {
            Id = Guid.NewGuid().ToString(),
            Code = PermissionCatalog.Actions.Read,
            Name = "Lire"
        });
        await db.SaveChangesAsync();

        var service = new UserPermissionService(db);
        var allowed = await service.HasPermissionAsync(
            user.Id,
            societeId: 1,
            moduleCode: "dashboard",
            actionCode: "read");

        allowed.Should().BeTrue();
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"UserPermissionServiceTests_{Guid.NewGuid():N}")
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<(ApplicationUser User, IdentityRole Role)> SeedUserWithRoleAsync(
        AppDbContext db,
        string roleName,
        int? societeId)
    {
        if (societeId.HasValue)
        {
            db.Societes.Add(new Societe
            {
                Id = societeId.Value,
                Nom = $"Societe {societeId.Value}"
            });
        }

        var role = new IdentityRole(roleName)
        {
            NormalizedName = roleName.ToUpperInvariant()
        };

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = $"user-{Guid.NewGuid():N}",
            Email = $"user-{Guid.NewGuid():N}@example.test",
            NomComplet = "Test User",
            SocieteId = societeId,
            PrimaryRoleKey = AppRoles.ToPrimaryRoleKey(roleName, societeId),
            IsActive = true
        };

        db.Roles.Add(role);
        db.Users.Add(user);
        db.UserRoles.Add(new IdentityUserRole<string>
        {
            UserId = user.Id,
            RoleId = role.Id
        });

        await db.SaveChangesAsync();
        return (user, role);
    }

    private static async Task GrantPermissionAsync(
        AppDbContext db,
        IdentityRole role,
        string moduleCode,
        string actionCode)
    {
        var module = new Module
        {
            Id = Guid.NewGuid().ToString(),
            Code = moduleCode,
            Name = moduleCode
        };

        var action = new Action
        {
            Id = Guid.NewGuid().ToString(),
            Code = actionCode,
            Name = actionCode
        };

        db.Modules.Add(module);
        db.Actions.Add(action);
        db.Permissions.Add(new Permission
        {
            Id = Guid.NewGuid().ToString(),
            RoleId = role.Id,
            ModuleId = module.Id,
            ActionId = action.Id
        });

        await db.SaveChangesAsync();
    }
}
