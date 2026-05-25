using System.Security.Claims;
using backend.Application.Security;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using backend.Infrastructure.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace backend.IntegrationTests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"SmsiManagerTests_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "smsi-tests-signing-key-2026-with-strong-length",
                ["Jwt:Issuer"] = "smsi-tests",
                ["Jwt:Audience"] = "smsi-tests-client",
                ["Jwt:ExpireMinutes"] = "60",
                ["EmailMonitoring:Enabled"] = "false",
            });
        });

        builder.ConfigureServices(services =>
        {
            var hostedServicesToRemove = services
                .Where(descriptor =>
                    descriptor.ServiceType == typeof(IHostedService)
                    && descriptor.ImplementationType is not null
                    && (descriptor.ImplementationType == typeof(RappelHostedService)
                        || descriptor.ImplementationType == typeof(EmailMonitoringService)))
                .ToList();

            foreach (var descriptor in hostedServicesToRemove)
            {
                services.Remove(descriptor);
            }

            var dbContextDescriptor = services.SingleOrDefault(
                descriptor => descriptor.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbContextDescriptor is not null)
            {
                services.Remove(dbContextDescriptor);
            }

            var dbContextOptionsDescriptor = services.SingleOrDefault(
                descriptor => descriptor.ServiceType == typeof(IDbContextOptionsConfiguration<AppDbContext>));
            if (dbContextOptionsDescriptor is not null)
            {
                services.Remove(dbContextOptionsDescriptor);
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }

    public async Task<(ApplicationUser User, string Password)> SeedUserAsync(
        string roleName = AppRoles.Consultant,
        int? societeId = 1,
        string password = "Test123!")
    {
        using var scope = Services.CreateScope();
        var serviceProvider = scope.ServiceProvider;

        var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureCreatedAsync();

        if (societeId.HasValue)
        {
            var societeExists = await dbContext.Societes.AnyAsync(s => s.Id == societeId.Value);
            if (!societeExists)
            {
                dbContext.Societes.Add(new Societe
                {
                    Id = societeId.Value,
                    Nom = $"Societe {societeId.Value}"
                });

                await dbContext.SaveChangesAsync();
            }
        }

        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            var roleCreation = await roleManager.CreateAsync(new IdentityRole(roleName));
            if (!roleCreation.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Impossible de creer le role '{roleName}': {string.Join(", ", roleCreation.Errors.Select(e => e.Description))}");
            }
        }

        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var email = $"test.{Guid.NewGuid():N}@example.com";

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            NomComplet = "Integration Test User",
            SocieteId = societeId,
            PrimaryRoleKey = AppRoles.ToPrimaryRoleKey(roleName, societeId),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Impossible de creer l'utilisateur de test: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
        }

        var addRoleResult = await userManager.AddToRoleAsync(user, roleName);
        if (!addRoleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Impossible d'assigner le role '{roleName}' a l'utilisateur: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
        }

        var claims = new List<Claim> { new("NomComplet", user.NomComplet) };
        if (societeId.HasValue)
        {
            claims.Add(new Claim("SocieteId", societeId.Value.ToString()));
            claims.Add(new Claim("SocieteNom", $"Societe {societeId.Value}"));
        }

        var addClaimsResult = await userManager.AddClaimsAsync(user, claims);
        if (!addClaimsResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Impossible d'ajouter les claims a l'utilisateur de test: {string.Join(", ", addClaimsResult.Errors.Select(e => e.Description))}");
        }

        return (user, password);
    }
}
