using backend.Application.DTOs.Controles;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Services
{
    public static class DbInitializer
    {
        private sealed record DemoUserSeed(string Email, string Password, string NomComplet, string Role);

        // ============================================================
        // RÔLES PRÉDÉFINIS DU SYSTÈME
        // ============================================================
        private static readonly string[] SystemRoles =
        [
            "Super Admin",
            "Admin",
            "RSSI",
            "Consultant",
            "Auditeur",
            "DSI",
            "DRH",
            "Employé",
            "Utilisateur Standard",
        ];

        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            var config = serviceProvider.GetRequiredService<IConfiguration>();
            var environment = serviceProvider.GetRequiredService<IWebHostEnvironment>();

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
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // ============================================================
            // ÉTAPE 1 : INITIALISATION DES RÔLES (si absents)
            // ============================================================
            await SeedRolesAsync(roleManager);

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
            // INITIALISATION DES CONTRÔLES (une seule fois)
            // ============================================================
            await SeedControlesAsync(serviceProvider);

            // ============================================================
            // ÉTAPE 2 : INITIALISATION DES UTILISATEURS SYSTÈME
            // ============================================================

            // --- Admin système par défaut ---
            var adminEmail = config["SeedUsers:Admin:Email"] ?? "admin@alexsys.com";
            var adminPassword = config["SeedUsers:Admin:Password"] ?? "Admin@123456!";
            var adminName = config["SeedUsers:Admin:NomComplet"] ?? "Administrateur Système";
            var adminRole = config["SeedUsers:Admin:Role"] ?? "Admin";

            // --- Utilisateur standard par défaut ---
            var standardEmail = config["SeedUsers:Standard:Email"] ?? "user@alexsys.com";
            var standardPassword = config["SeedUsers:Standard:Password"] ?? "User@123456!";
            var standardName = config["SeedUsers:Standard:NomComplet"] ?? "Utilisateur Standard";
            var standardRole = config["SeedUsers:Standard:Role"] ?? "Utilisateur Standard";

            // --- Utilisateurs prédéfinis ---
            await SeedUserIfMissingAsync(userManager, adminEmail, adminPassword, adminName, adminRole);
            await SeedUserIfMissingAsync(userManager, standardEmail, standardPassword, standardName, standardRole);
            await SeedUserIfMissingAsync(userManager, "boumlalilham@gmail.com", "Admin@123456!", "Ilham Boumlal", "Super Admin");
            await SeedUserIfMissingAsync(userManager, "auditeur@gmail.com", "Auditeur@123456!", "Auditeur Système", "Auditeur");
            await SeedUserIfMissingAsync(userManager, "consultant@gmail.com", "Consul@123456!", "Consultant Système", "Consultant");
            await SeedUserIfMissingAsync(userManager, "rssi@gmail.com", "Rssi@123456!", "RSSI Système", "RSSI");

            Console.WriteLine("✅ Initialisation des utilisateurs système terminée");

            // ============================================================
            // ÉTAPE 3 : SEED DÉMO RBAC (utilisateurs + documents)
            // ============================================================
            await SeedDocumentationMvpDemoAsync(dbContext, userManager, config);
        }

        // ============================================================
        // SEED DES RÔLES
        // ============================================================

        /// <summary>
        /// Crée les rôles système s'ils n'existent pas encore dans la base de données.
        /// </summary>
        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            foreach (var roleName in SystemRoles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                    if (result.Succeeded)
                        Console.WriteLine($"✅ Rôle créé : {roleName}");
                    else
                        Console.WriteLine($"❌ Erreur création rôle '{roleName}' : {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
                else
                {
                    Console.WriteLine($"ℹ️  Rôle déjà existant : {roleName}");
                }
            }
        }

        // ============================================================
        // SEED DES ACTIONS
        // ============================================================

        /// <summary>
        /// Initialise les actions prédéfinies (Lecture, Écriture, Modification, etc.)
        /// À COMMENTER APRÈS LA PREMIÈRE EXÉCUTION
        /// </summary>
        private static async Task SeedActionsAsync(AppDbContext dbContext)
        {
            if (await dbContext.Actions.AnyAsync())
            {
                Console.WriteLine("ℹ️ Les actions existent déjà. Seed ignoré.");
                return;
            }

            var actions = new List<Action>
            {
                new() { Id = Guid.NewGuid().ToString(), Code = "view",   Name = "Lecture"      },
                new() { Id = Guid.NewGuid().ToString(), Code = "create", Name = "Écriture"     },
                new() { Id = Guid.NewGuid().ToString(), Code = "edit",   Name = "Modification" },
                new() { Id = Guid.NewGuid().ToString(), Code = "delete", Name = "Suppression"  },
                new() { Id = Guid.NewGuid().ToString(), Code = "manage", Name = "Gestion"      },
                new() { Id = Guid.NewGuid().ToString(), Code = "export", Name = "Export"       },
            };

            await dbContext.Actions.AddRangeAsync(actions);
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅ {actions.Count} actions prédéfinies créées");
        }

        // ============================================================
        // SEED DES MODULES
        // ============================================================

        /// <summary>
        /// Initialise les modules par défaut.
        /// À COMMENTER APRÈS LA PREMIÈRE EXÉCUTION
        /// </summary>
        private static async Task SeedModulesAsync(AppDbContext dbContext)
        {
            var modules = new List<Module>
            {
                new() { Code = "dashboard", Name = "Tableau De Bord" },
                new() { Code = "holdings",  Name = "Holdings"        },
                new() { Code = "societes",  Name = "Sociétés"        },
                new() { Code = "users",     Name = "Utilisateurs"    },
                new() { Code = "roles",     Name = "Rôles"           },
                new() { Code = "incidents", Name = "Incidents"       },
                new() { Code = "risques",   Name = "Risques"         },
                new() { Code = "audit",     Name = "Audit"           },
                new() { Code = "config",    Name = "Configuration"   },
            };

            await dbContext.Modules.AddRangeAsync(modules);
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅ {modules.Count} modules créés");
        }

        // ============================================================
        // SEED DES PERMISSIONS
        // ============================================================

        /// <summary>
        /// Initialise les permissions (combinaison module x action).
        /// À COMMENTER APRÈS LA PREMIÈRE EXÉCUTION
        /// </summary>
        private static async Task SeedPermissionsAsync(AppDbContext dbContext)
        {
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

        // ============================================================
        // SEED DES CONTRÔLES
        // ============================================================

        /// <summary>
        /// Initialise les contrôles ISO 27001:2022 à partir du fichier controles.json
        /// </summary>
        public static async Task SeedControlesAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();

            if (await dbContext.Controles.AnyAsync())
            {
                Console.WriteLine("Controles deja presents. Seed ignore.");
                return;
            }

            // Chercher le fichier JSON a differents emplacements
            var candidatePaths = new[]
            {
        Path.Combine(AppContext.BaseDirectory, "controles.json"),
        Path.Combine(AppContext.BaseDirectory, "Infrastructure", "SeedData", "controles.json"),
        Path.Combine(Directory.GetCurrentDirectory(), "controles.json"),
        Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json"),
        Path.Combine(Directory.GetCurrentDirectory(), "backend", "backend", "Infrastructure", "SeedData", "controles.json")
    };

            var jsonPath = candidatePaths.FirstOrDefault(File.Exists);
            if (string.IsNullOrWhiteSpace(jsonPath))
            {
                Console.WriteLine("Fichier controles.json non trouve. Chemins testes:");
                foreach (var path in candidatePaths)
                {
                    Console.WriteLine($" - {path}");
                }

                return;
            }

            Console.WriteLine($"Fichier trouve: {jsonPath}");

            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            };

            try
            {
                var jsonContent = await File.ReadAllTextAsync(jsonPath);
                var dtos = System.Text.Json.JsonSerializer.Deserialize<List<ControleDto>>(jsonContent, options);

                if (dtos is null || dtos.Count == 0)
                {
                    Console.WriteLine("Aucune donnee trouvee dans le fichier JSON");
                    return;
                }

                var controles = new List<Controle>();

                foreach (var dto in dtos)
                {
                    var controle = new Controle
                    {
                        Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                        Code = dto.Code,
                        Titre = dto.Titre,
                        Description = dto.Description,
                        Domaine = dto.Domaine,
                        Applicable = dto.Applicable,
                        RaisonsApplicabilite = dto.RaisonsApplicabilite != null && dto.RaisonsApplicabilite.Any()
                            ? System.Text.Json.JsonSerializer.Serialize(dto.RaisonsApplicabilite)
                            : null,
                        RaisonExclusion = dto.RaisonExclusion,
                        Statut = dto.Statut,
                        JustificationConformite = dto.JustificationConformite,
                        Remarque = dto.Remarque,
                        Preuves = dto.Preuves,
                        Steps = dto.Steps != null
                            ? System.Text.Json.JsonSerializer.Serialize(dto.Steps)
                            : null,
                        Priorite = dto.Priorite,
                        StatutPlan = dto.StatutPlan,
                        ResponsablePlan = dto.ResponsablePlan,
                        DateEcheance = dto.DateEcheance,
                        DateMiseAJour = dto.DateMiseAJour ?? DateTime.UtcNow,
                        DernierModificateurId = dto.DernierModificateurId,
                        DernierModificateurNom = dto.DernierModificateurNom
                    };

                    controles.Add(controle);
                }

                await dbContext.Controles.AddRangeAsync(controles);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"OK: {controles.Count} controles ISO 27001 inseres.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors du seed des controles: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }
        // ============================================================
        // HELPER : créer un utilisateur s'il est absent
        // ============================================================

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
                Console.WriteLine($"ℹ️  Utilisateur déjà existant : {email}");
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
                var roleResult = await userManager.AddToRoleAsync(user, role);
                if (roleResult.Succeeded)
                    Console.WriteLine($"✅ Utilisateur créé : {email}  →  rôle [{role}]");
                else
                    Console.WriteLine($"⚠️  Utilisateur créé mais rôle non assigné ({email}) : {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
            }
            else
            {
                Console.WriteLine($"❌ Erreur création utilisateur {email} : {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        // ============================================================
        // SEED DÉMO RBAC
        // ============================================================

        private static async Task SeedDocumentationMvpDemoAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            IConfiguration config)
        {
            const string demoSocieteName = "Societe Demo RBAC";
            var societe = await dbContext.Societes.FirstOrDefaultAsync(s => s.Nom == demoSocieteName);
            if (societe is null)
            {
                societe = new Societe { Nom = demoSocieteName, Logo = null };
                dbContext.Societes.Add(societe);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ Société créée : {demoSocieteName}");
            }

            var demoUsers = new[]
            {
                new DemoUserSeed("rssi.demo@smsi.local",    "RssiDemo@123",    "RSSI Demo",    "RSSI"      ),
                new DemoUserSeed("drh.demo@smsi.local",     "DrhDemo@123",     "DRH Demo",     "DRH"       ),
                new DemoUserSeed("dsi.demo@smsi.local",     "DsiDemo@123",     "DSI Demo",     "DSI"       ),
                new DemoUserSeed("employe.demo@smsi.local", "EmployeDemo@123", "Employe Demo", "Employé"   ),
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
                    Name                 = "[DEMO] Procedure RH - Formation securite",
                    Type                 = "Procedure",
                    Category             = "RH",
                    Status               = "brouillon",
                    Version              = "1.0",
                    Classification       = "Interne",
                    Author               = drh.NomComplet,
                    Clause               = "7.2",
                    Controle             = "A.6.3",
                    Description          = "Document RH non approuve pour tester les restrictions DRH.",
                    SocieteId            = societe.Id,
                    CreatedByUserId      = drh.Id,
                    LastModifiedByUserId = drh.Id,
                    CreatedAt            = DateTime.UtcNow.AddDays(-8),
                    UpdatedAt            = DateTime.UtcNow.AddDays(-2),
                },
                new DocumentationDocument
                {
                    Name                 = "[DEMO] Guide Technique - Gestion des acces",
                    Type                 = "Guide",
                    Category             = "Technique",
                    Status               = "en-validation",
                    Version              = "0.9",
                    Classification       = "Interne",
                    Author               = dsi.NomComplet,
                    Clause               = "8.1",
                    Controle             = "A.8.2",
                    Description          = "Document technique en validation pour tester le perimetre DSI.",
                    SocieteId            = societe.Id,
                    CreatedByUserId      = dsi.Id,
                    LastModifiedByUserId = dsi.Id,
                    CreatedAt            = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt            = DateTime.UtcNow.AddDays(-1),
                },
                new DocumentationDocument
                {
                    Name                 = "[DEMO] Politique SMSI - Gouvernance",
                    Type                 = "Politique",
                    Category             = "Gouvernance",
                    Status               = "approuve",
                    Version              = "2.0",
                    Classification       = "Interne",
                    Author               = rssi.NomComplet,
                    Approver             = rssi.NomComplet,
                    Clause               = "5.2",
                    Controle             = "A.5.1",
                    Description          = "Document approuve par le RSSI, visible par tous les employes.",
                    SocieteId            = societe.Id,
                    CreatedByUserId      = rssi.Id,
                    LastModifiedByUserId = rssi.Id,
                    ApprovedByUserId     = rssi.Id,
                    ApprovedAt           = DateTime.UtcNow.AddDays(-5),
                    CreatedAt            = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt            = DateTime.UtcNow.AddDays(-5),
                },
                new DocumentationDocument
                {
                    Name                 = "[DEMO] Registre RH - Habilitations",
                    Type                 = "Registre",
                    Category             = "RH",
                    Status               = "approuve",
                    Version              = "1.1",
                    Classification       = "Interne",
                    Author               = drh.NomComplet,
                    Approver             = rssi.NomComplet,
                    Clause               = "7.5.3",
                    Controle             = "A.6.1",
                    Description          = "Document RH cree par DRH et approuve par RSSI.",
                    SocieteId            = societe.Id,
                    CreatedByUserId      = drh.Id,
                    LastModifiedByUserId = rssi.Id,
                    ApprovedByUserId     = rssi.Id,
                    ApprovedAt           = DateTime.UtcNow.AddDays(-4),
                    CreatedAt            = DateTime.UtcNow.AddDays(-9),
                    UpdatedAt            = DateTime.UtcNow.AddDays(-4),
                },
            };

            foreach (var seedDoc in documentSeeds)
            {
                var exists = await dbContext.DocumentationDocuments.AnyAsync(d =>
                    d.SocieteId == societe.Id && d.Name == seedDoc.Name);

                if (!exists)
                    dbContext.DocumentationDocuments.Add(seedDoc);
            }

            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅ Documentation seed terminée");
        }

        // ============================================================
        // HELPER : créer / mettre à jour un utilisateur démo
        // ============================================================

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
                    CreatedAt = DateTime.UtcNow,
                };

                var createResult = await userManager.CreateAsync(user, seed.Password);
                if (!createResult.Succeeded)
                    throw new InvalidOperationException(
                        $"Impossible de créer l'utilisateur démo {seed.Email} : {string.Join(", ", createResult.Errors.Select(e => e.Description))}");

                Console.WriteLine($"✅ Utilisateur démo créé : {seed.Email}");
            }
            else
            {
                var changed = false;

                if (!string.Equals(user.NomComplet, seed.NomComplet, StringComparison.Ordinal))
                { user.NomComplet = seed.NomComplet; changed = true; }

                if (user.SocieteId != societeId)
                { user.SocieteId = societeId; changed = true; }

                if (!user.EmailConfirmed)
                { user.EmailConfirmed = true; changed = true; }

                if (!user.IsActive)
                { user.IsActive = true; changed = true; }

                if (changed)
                {
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                        throw new InvalidOperationException(
                            $"Impossible de mettre à jour l'utilisateur démo {seed.Email} : {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                }

                // Réinitialiser le mot de passe
                var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await userManager.ResetPasswordAsync(user, resetToken, seed.Password);

                if (!resetResult.Succeeded && !await userManager.HasPasswordAsync(user))
                {
                    var addPwdResult = await userManager.AddPasswordAsync(user, seed.Password);
                    if (!addPwdResult.Succeeded)
                        throw new InvalidOperationException(
                            $"Impossible de définir le mot de passe démo pour {seed.Email} : {string.Join(", ", addPwdResult.Errors.Select(e => e.Description))}");
                }
            }

            // Réassigner le rôle proprement
            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                    throw new InvalidOperationException(
                        $"Impossible de réinitialiser les rôles pour {seed.Email} : {string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
            }

            var addRoleResult = await userManager.AddToRoleAsync(user, seed.Role);
            if (!addRoleResult.Succeeded)
                throw new InvalidOperationException(
                    $"Impossible d'assigner le rôle {seed.Role} à {seed.Email} : {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");

            return user;
        }
    }
}