using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ActionEntity = backend.Domain.Entities.Action;

namespace backend.IntegrationTests.Helpers;

internal static class IntegrationTestAuthHelper
{
    public static async Task<(ApplicationUser User, string Password, string Token)> LoginAsRoleAsync(
        CustomWebApplicationFactory factory,
        HttpClient client,
        string roleName,
        int? societeId,
        params (string ModuleCode, string ActionCode)[] grantedPermissions)
    {
        var seeded = await factory.SeedUserAsync(roleName, societeId);

        foreach (var (moduleCode, actionCode) in grantedPermissions)
        {
            await GrantPermissionAsync(factory, roleName, moduleCode, actionCode);
        }

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = seeded.User.Email,
            Password = seeded.Password
        });

        loginResponse.EnsureSuccessStatusCode();

        var token = await ExtractTokenAsync(loginResponse);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return (seeded.User, seeded.Password, token);
    }

    public static async Task GrantPermissionAsync(
        CustomWebApplicationFactory factory,
        string roleName,
        string moduleCode,
        string actionCode)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var role = await db.Roles.FirstAsync(r => r.Name == roleName);

        var module = await db.Modules.FirstOrDefaultAsync(m => m.Code == moduleCode);
        if (module is null)
        {
            module = new Module
            {
                Code = moduleCode,
                Name = moduleCode
            };
            db.Modules.Add(module);
        }

        var action = await db.Actions.FirstOrDefaultAsync(a => a.Code == actionCode);
        if (action is null)
        {
            action = new ActionEntity
            {
                Id = Guid.NewGuid().ToString(),
                Code = actionCode,
                Name = actionCode
            };
            db.Actions.Add(action);
        }

        await db.SaveChangesAsync();

        var permissionExists = await db.Permissions.AnyAsync(p =>
            p.RoleId == role.Id &&
            p.ModuleId == module.Id &&
            p.ActionId == action.Id);

        if (!permissionExists)
        {
            db.Permissions.Add(new Permission
            {
                RoleId = role.Id,
                ModuleId = module.Id,
                ActionId = action.Id
            });

            await db.SaveChangesAsync();
        }
    }

    private static async Task<string> ExtractTokenAsync(HttpResponseMessage loginResponse)
    {
        var json = await loginResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var token = doc.RootElement.GetProperty("token").GetString();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("JWT token was not returned by /api/auth/login.");
        }

        return token;
    }
}
