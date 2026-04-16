using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Services
{
    public static class DbInitializer
    {
        private sealed record DemoUserSeed(string Email, string Password, string NomComplet, string Role);

        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            try
            {
                await dbContext.Database.MigrateAsync();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning"))
            {
                // In local development, allow startup even when a migration is missing.
                await dbContext.Database.EnsureCreatedAsync();
            }

            var config = serviceProvider.GetRequiredService<IConfiguration>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Création des rôles
            string[] roles = {
                "Admin", "Chef de Projet", "Membre", "Lecteur",
                "Responsable Sécurité", "Auditeur Interne",
                "Gestionnaire de Projet", "Consultant", "Utilisateur Standard",
                "Responsable Conformité", "DPO", "Direction Générale",
                "Responsable DevOps",
                "Administrateur Infrastructure et Cloud",
                "RSSI", "DRH", "DSI", "Employé",
                "Responsable Développement",
                "Responsable Cloud",
                "Responsable Infrastructure et Cloud"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // Seed users from configuration or use defaults
            var adminEmail = config["SeedUsers:Admin:Email"] ?? "admin@alexsys.com";
            var adminPassword = config["SeedUsers:Admin:Password"] ?? "Admin@123456!";
            var adminName = config["SeedUsers:Admin:NomComplet"] ?? "Administrateur Système";
            var adminRole = config["SeedUsers:Admin:Role"] ?? "Admin";

            var standardEmail = config["SeedUsers:Standard:Email"] ?? "user@alexsys.com";
            var standardPassword = config["SeedUsers:Standard:Password"] ?? "User@123456!";
            var standardName = config["SeedUsers:Standard:NomComplet"] ?? "Utilisateur Standard";
            var standardRole = config["SeedUsers:Standard:Role"] ?? "Utilisateur Standard";

            await EnsureRoleExistsAsync(roleManager, adminRole);
            await EnsureRoleExistsAsync(roleManager, standardRole);

            await SeedUserIfMissingAsync(userManager, adminEmail, adminPassword, adminName, adminRole);
            await SeedUserIfMissingAsync(userManager, standardEmail, standardPassword, standardName, standardRole);

            // Seed demo users and documentation for RBAC demonstration
            await SeedDocumentationMvpDemoAsync(dbContext, userManager, roleManager, config);
        }

        private static async Task EnsureRoleExistsAsync(RoleManager<IdentityRole> roleManager, string role)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        private static async Task SeedUserIfMissingAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string password,
            string nomComplet,
            string role)
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null) return;

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                NomComplet = nomComplet,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
            }
        }

        private static async Task SeedDocumentationMvpDemoAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration config)
        {
            const string demoSocieteName = "Societe Demo RBAC";
            var societe = await dbContext.Societes.FirstOrDefaultAsync(s => s.Nom == demoSocieteName);
            if (societe is null)
            {
                societe = new Societe
                {
                    Nom = demoSocieteName,
                    Logo = null
                };
                dbContext.Societes.Add(societe);
                await dbContext.SaveChangesAsync();
            }

            var demoUsers = new[]
            {
                new DemoUserSeed("rssi.demo@smsi.local", "RssiDemo@123", "RSSI Demo", "RSSI"),
                new DemoUserSeed("drh.demo@smsi.local", "DrhDemo@123", "DRH Demo", "DRH"),
                new DemoUserSeed("dsi.demo@smsi.local", "DsiDemo@123", "DSI Demo", "DSI"),
                new DemoUserSeed("employe.demo@smsi.local", "EmployeDemo@123", "Employe Demo", "Employé"),
            };

            var usersByRole = new Dictionary<string, ApplicationUser>(StringComparer.OrdinalIgnoreCase);
            foreach (var demoUser in demoUsers)
            {
                await EnsureRoleExistsAsync(roleManager, demoUser.Role);
                var user = await EnsureDemoUserAsync(userManager, demoUser, societe.Id);
                usersByRole[demoUser.Role] = user;
            }

            var rssi = usersByRole["RSSI"];
            var drh = usersByRole["DRH"];
            var dsi = usersByRole["DSI"];

            var documentSeeds = new[]
            {
                new DocumentationDocument
                {
                    Name = "[DEMO] Procedure RH - Formation securite",
                    Type = "Procedure",
                    Category = "RH",
                    Status = "brouillon",
                    Version = "1.0",
                    Classification = "Interne",
                    Author = drh.NomComplet,
                    Clause = "7.2",
                    Controle = "A.6.3",
                    Description = "Document RH non approuve pour tester les restrictions DRH.",
                    SocieteId = societe.Id,
                    CreatedByUserId = drh.Id,
                    LastModifiedByUserId = drh.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-8),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new DocumentationDocument
                {
                    Name = "[DEMO] Guide Technique - Gestion des acces",
                    Type = "Guide",
                    Category = "Technique",
                    Status = "en-validation",
                    Version = "0.9",
                    Classification = "Interne",
                    Author = dsi.NomComplet,
                    Clause = "8.1",
                    Controle = "A.8.2",
                    Description = "Document technique en validation pour tester le perimetre DSI.",
                    SocieteId = societe.Id,
                    CreatedByUserId = dsi.Id,
                    LastModifiedByUserId = dsi.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new DocumentationDocument
                {
                    Name = "[DEMO] Politique SMSI - Gouvernance",
                    Type = "Politique",
                    Category = "Gouvernance",
                    Status = "approuve",
                    Version = "2.0",
                    Classification = "Interne",
                    Author = rssi.NomComplet,
                    Approver = rssi.NomComplet,
                    Clause = "5.2",
                    Controle = "A.5.1",
                    Description = "Document approuve par le RSSI, visible par tous les employes.",
                    SocieteId = societe.Id,
                    CreatedByUserId = rssi.Id,
                    LastModifiedByUserId = rssi.Id,
                    ApprovedByUserId = rssi.Id,
                    ApprovedAt = DateTime.UtcNow.AddDays(-5),
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new DocumentationDocument
                {
                    Name = "[DEMO] Registre RH - Habilitations",
                    Type = "Registre",
                    Category = "RH",
                    Status = "approuve",
                    Version = "1.1",
                    Classification = "Interne",
                    Author = drh.NomComplet,
                    Approver = rssi.NomComplet,
                    Clause = "7.5.3",
                    Controle = "A.6.1",
                    Description = "Document RH cree par DRH et approuve par RSSI.",
                    SocieteId = societe.Id,
                    CreatedByUserId = drh.Id,
                    LastModifiedByUserId = rssi.Id,
                    ApprovedByUserId = rssi.Id,
                    ApprovedAt = DateTime.UtcNow.AddDays(-4),
                    CreatedAt = DateTime.UtcNow.AddDays(-9),
                    UpdatedAt = DateTime.UtcNow.AddDays(-4)
                }
            };

            foreach (var seedDoc in documentSeeds)
            {
                var exists = await dbContext.DocumentationDocuments.AnyAsync(d =>
                    d.SocieteId == societe.Id && d.Name == seedDoc.Name);

                if (!exists)
                {
                    dbContext.DocumentationDocuments.Add(seedDoc);
                }
            }

            await dbContext.SaveChangesAsync();
        }

        private static async Task<ApplicationUser> EnsureDemoUserAsync(
            UserManager<ApplicationUser> userManager,
            DemoUserSeed seed,
            int societeId)
        {
            var user = await userManager.FindByEmailAsync(seed.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = seed.Email,
                    Email = seed.Email,
                    NomComplet = seed.NomComplet,
                    SocieteId = societeId,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(user, seed.Password);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible de creer l'utilisateur demo {seed.Email}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }
            }
            else
            {
                var changed = false;
                if (!string.Equals(user.NomComplet, seed.NomComplet, StringComparison.Ordinal))
                {
                    user.NomComplet = seed.NomComplet;
                    changed = true;
                }
                if (user.SocieteId != societeId)
                {
                    user.SocieteId = societeId;
                    changed = true;
                }
                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    changed = true;
                }
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    changed = true;
                }
                if (changed)
                {
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de mettre a jour l'utilisateur demo {seed.Email}: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                    }
                }

                var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await userManager.ResetPasswordAsync(user, resetToken, seed.Password);
                if (!resetResult.Succeeded && !await userManager.HasPasswordAsync(user))
                {
                    var addPwdResult = await userManager.AddPasswordAsync(user, seed.Password);
                    if (!addPwdResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de definir le mot de passe demo pour {seed.Email}: {string.Join(", ", addPwdResult.Errors.Select(e => e.Description))}");
                    }
                }
            }

            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible de reinitialiser les roles pour {seed.Email}: {string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
                }
            }

            var addRoleResult = await userManager.AddToRoleAsync(user, seed.Role);
            if (!addRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Impossible d'assigner le role {seed.Role} a {seed.Email}: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
            }

            return user;
        }
    }
}