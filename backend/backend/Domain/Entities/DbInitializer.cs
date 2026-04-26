using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Services
{
    public static class DbInitializer
    {
        private sealed record DemoUserSeed(string Email, string Password, string NomComplet, string Role);

        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            var config = serviceProvider.GetRequiredService<IConfiguration>();

            try
            {
                await dbContext.Database.MigrateAsync();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning"))
            {
                // In local development, allow startup even when a migration is missing.
                await dbContext.Database.EnsureCreatedAsync();
            }

            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // ============================================================
            // INITIALISATION DES ACTIONS (une seule fois)
            // ============================================================
            //await SeedActionsAsync(dbContext);

            // ============================================================
            // INITIALISATION DES MODULES (une seule fois)
            // ============================================================
            //await SeedModulesAsync(dbContext);

            // ============================================================
            // INITIALISATION DES PERMISSIONS (module x action)
            // ============================================================
            //await SeedPermissionsAsync(dbContext);

            // ============================================================
            // INITIALISATION DES UTILISATEURS
            // ============================================================
            // Seed users from configuration or use defaults
            var adminEmail = config["SeedUsers:Admin:Email"] ?? "admin@alexsys.com";
            var adminPassword = config["SeedUsers:Admin:Password"] ?? "Admin@123456!";
            var adminName = config["SeedUsers:Admin:NomComplet"] ?? "Administrateur Système";
            var adminRole = config["SeedUsers:Admin:Role"] ?? "Admin";

            var standardEmail = config["SeedUsers:Standard:Email"] ?? "user@alexsys.com";
            var standardPassword = config["SeedUsers:Standard:Password"] ?? "User@123456!";
            var standardName = config["SeedUsers:Standard:NomComplet"] ?? "Utilisateur Standard";
            var standardRole = config["SeedUsers:Standard:Role"] ?? "Utilisateur Standard";

            // VOTRE ADMIN PERSONNALISÉ 
            var yourAdminEmail = "boumlalilham@gmail.com";
            var yourAdminPassword = "Admin@123456!";
            var yourAdminName = "Ilham Boumlal";

            // Créer les utilisateurs (sans création de rôles)
            await SeedUserIfMissingAsync(userManager, adminEmail, adminPassword, adminName, adminRole);
            await SeedUserIfMissingAsync(userManager, standardEmail, standardPassword, standardName, standardRole);
            await SeedUserIfMissingAsync(userManager, yourAdminEmail, yourAdminPassword, yourAdminName, "Admin");

            Console.WriteLine($"✅ Vérification admin {yourAdminEmail} terminée");

            // Seed documentation for RBAC demonstration
            await SeedDocumentationMvpDemoAsync(dbContext, userManager, config);
        }

        /// <summary>
        /// Initialise les actions prédéfinies (Lecture, Écriture, Modification, etc.)
        /// À COMMENTER APRÈS LA PREMIÈRE EXÉCUTION
        /// </summary>
        private static async Task SeedActionsAsync(AppDbContext dbContext)
        {
            // VÉRIFIER SI DES ACTIONS EXISTENT DÉJÀ
            if (await dbContext.Actions.AnyAsync())
            {
                Console.WriteLine("ℹ️ Les actions existent déjà. Seed ignoré.");
                return;
            }

            var actions = new List<Action>
            {
                new Action { Id = Guid.NewGuid().ToString(), Code = "view", Name = "Lecture" },
                new Action { Id = Guid.NewGuid().ToString(), Code = "create", Name = "Écriture" },
                new Action { Id = Guid.NewGuid().ToString(), Code = "edit", Name = "Modification" },
                new Action { Id = Guid.NewGuid().ToString(), Code = "delete", Name = "Suppression" },
                new Action { Id = Guid.NewGuid().ToString(), Code = "manage", Name = "Gestion" },
                new Action { Id = Guid.NewGuid().ToString(), Code = "export", Name = "Export" }
            };

            await dbContext.Actions.AddRangeAsync(actions);
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅ {actions.Count} actions prédéfinies créées");
        }

        /// <summary>
        /// Initialise les modules par défaut
        /// À COMMENTER APRÈS LA PREMIÈRE EXÉCUTION
        /// </summary>
        private static async Task SeedModulesAsync(AppDbContext dbContext)
        {
            // VÉRIFIER SI DES MODULES EXISTENT DÉJÀ
          /*  if (await dbContext.Modules.AnyAsync())
            {
                Console.WriteLine("Les modules existent déjà. Seed ignoré.");
                return;
            }*/

            var modules = new List<Module>
            {
                new Module { Code = "dashboard", Name = "Tableau De Bord" },
                new Module { Code = "holdings", Name = "Holdings" },
                new Module { Code = "societes", Name = "Sociétés" },
                new Module { Code = "users", Name = "Utilisateurs" },
                new Module { Code = "roles", Name = "Rôles" },
                new Module { Code = "incidents", Name = "Incidents" },
                new Module { Code = "risques", Name = "Risques" },
                new Module { Code = "audit", Name = "Audit" },
                new Module { Code = "config", Name = "Configuration" }
            };

            await dbContext.Modules.AddRangeAsync(modules);
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅ {modules.Count} modules créés");
        }

        /// <summary>
        /// Initialise les permissions (combinaison module x action)
        /// À COMMENTER APRÈS LA PREMIÈRE EXÉCUTION
        /// </summary>
        private static async Task SeedPermissionsAsync(AppDbContext dbContext)
        {
            // VÉRIFIER SI DES PERMISSIONS EXISTENT DÉJÀ
            if (await dbContext.Permissions.AnyAsync())
            {
                Console.WriteLine("ℹ️ Les permissions existent déjà. Seed ignoré.");
                return;
            }

            var modules = await dbContext.Modules.ToListAsync();
            var actions = await dbContext.Actions.ToListAsync();

            if (!modules.Any() || !actions.Any())
            {
                Console.WriteLine("⚠️ Impossible de créer les permissions: modules ou actions manquants");
                return;
            }

            var permissions = new List<Permission>();

            foreach (var module in modules)
            {
                foreach (var action in actions)
                {
                    permissions.Add(new Permission
                    {
                        Id = Guid.NewGuid().ToString(),
                        ModuleId = module.Id,
                        ActionId = action.Id,
                    });
                }
            }

            await dbContext.Permissions.AddRangeAsync(permissions);
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅ {permissions.Count} permissions créées ({modules.Count} modules × {actions.Count} actions)");
        }

        private static async Task SeedUserIfMissingAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string password,
            string nomComplet,
            string role)
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null)
            {
                Console.WriteLine($"ℹ️ L'utilisateur {email} existe déjà");
                return;
            }

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
                // Note: Le rôle doit déjà exister dans le système
                await userManager.AddToRoleAsync(user, role);
                Console.WriteLine($"✅ Utilisateur créé: {email} avec le rôle {role}");
            }
            else
            {
                Console.WriteLine($"❌ Erreur création utilisateur {email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        private static async Task SeedDocumentationMvpDemoAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
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
                Console.WriteLine($"✅ Société créée: {demoSocieteName}");
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
            Console.WriteLine($"✅ Documentation seed terminée");
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
                Console.WriteLine($"✅ Utilisateur demo créé: {seed.Email}");
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