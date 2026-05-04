using backend.Application.DTOs.Controles;
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
                await dbContext.Database.EnsureCreatedAsync();
            }

            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // ══════════════════════════════════════════════════════════════
            //  TOUTES LES INITIALISATIONS SONT ACTIVES
            // ══════════════════════════════════════════════════════════════

            // ÉTAPE 1 : Rôles
          //  await SeedRolesAsync(roleManager);

            // ÉTAPE 2 : Actions
          //  await SeedActionsAsync(dbContext);

            // ÉTAPE 3 : Modules
            //await SeedModulesAsync(dbContext);

            // ÉTAPE 4 : Permissions
            //await SeedPermissionsAsync(dbContext);

            // ÉTAPE 5 : Contrôles ISO 27001 (depuis fichier JSON)
           // await SeedControlesAsync(serviceProvider);

            // ÉTAPE 6 : Utilisateurs système
            //await SeedUsersAsync(userManager, config);

            // ÉTAPE 7 : Démo RBAC (utilisateurs démo + documents)
           // await SeedDocumentationMvpDemoAsync(dbContext, userManager, config);

            // ══════════════════════════════════════════════════════════════

            Console.WriteLine("✅ Toutes les initialisations sont terminées !");
        }

        // ============================================================
        // ÉTAPE 1 — RÔLES
        // ============================================================

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
        // ÉTAPE 2 — ACTIONS
        // ============================================================

        private static async Task SeedActionsAsync(AppDbContext db)
        {
            if (await db.Actions.AnyAsync())
            {
                Console.WriteLine("ℹ️  Actions déjà présentes — seed ignoré.");
                return;
            }

            var actions = new List<Action>
            {
                new() { Id = Guid.NewGuid().ToString(), Code = "view",   Name = "Lecture"      },
                new() { Id = Guid.NewGuid().ToString(), Code = "create", Name = "Écriture"     },
                new() { Id = Guid.NewGuid().ToString(), Code = "edit",   Name = "Modification" },
                new() { Id = Guid.NewGuid().ToString(), Code = "delete", Name = "Suppression"  },
                new() { Id = Guid.NewGuid().ToString(), Code = "export", Name = "Export"       },
                new() { Id = Guid.NewGuid().ToString(), Code = "manage", Name = "Gestion"      },
            };

            await db.Actions.AddRangeAsync(actions);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {actions.Count} actions créées.");
        }

        // ============================================================
        // ÉTAPE 3 — MODULES
        // ============================================================

        private static async Task SeedModulesAsync(AppDbContext db)
        {
            if (await db.Modules.AnyAsync())
            {
                Console.WriteLine("ℹ️  Modules déjà présents — seed ignoré.");
                return;
            }

            // ⚠️ Les codes doivent correspondre EXACTEMENT aux moduleCode
            //    utilisés dans Header.jsx côté React.
            var modules = new List<Module>
            {
                new() { Id = Guid.NewGuid().ToString(), Code = "dashboard",       Name = "Tableau De Bord",  CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "cartographie",    Name = "Cartographie",     CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "pdca",            Name = "PDCA",             CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "clauses",         Name = "Clauses",          CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "controles",       Name = "Contrôles",        CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "documentation",   Name = "Documentation",    CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "risques",         Name = "Risques",          CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "audit",           Name = "Audits",           CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "actifs",          Name = "Actifs",           CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "sensibilisation", Name = "Sensibilisation",  CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "incidents",       Name = "Incidents",        CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "statistiques",    Name = "Statistiques",     CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "users",           Name = "Utilisateurs",     CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "societes",        Name = "Sociétés",         CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "holdings",        Name = "Holdings",         CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "roles",           Name = "Rôles",            CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid().ToString(), Code = "config",          Name = "Configuration",    CreatedAt = DateTime.UtcNow },
            };

            await db.Modules.AddRangeAsync(modules);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {modules.Count} modules créés.");
        }

        // ============================================================
        // ÉTAPE 4 — PERMISSIONS
        // ============================================================

        private static async Task SeedPermissionsAsync(AppDbContext db)
        {
            if (await db.Permissions.AnyAsync())
            {
                Console.WriteLine("ℹ️  Permissions déjà présentes — seed ignoré.");
                return;
            }

            // Lecture des IDs réels depuis la BD
            var modules = await db.Modules.ToDictionaryAsync(m => m.Code, m => m.Id);
            var actions = await db.Actions.ToDictionaryAsync(a => a.Code, a => a.Id);
            var roles = await db.Set<IdentityRole>().ToDictionaryAsync(r => r.Name!, r => r.Id);

            // Helpers — lèvent une exception claire si un code est manquant
            string M(string code)
            {
                if (modules.TryGetValue(code, out var id)) return id;
                throw new InvalidOperationException($"Module introuvable : '{code}'. Vérifiez SeedModulesAsync.");
            }

            string A(string code)
            {
                if (actions.TryGetValue(code, out var id)) return id;
                throw new InvalidOperationException($"Action introuvable : '{code}'. Vérifiez SeedActionsAsync.");
            }

            string Ro(string name)
            {
                if (roles.TryGetValue(name, out var id)) return id;
                throw new InvalidOperationException($"Rôle introuvable : '{name}'. Vérifiez SeedRolesAsync.");
            }

            var perms = new List<Permission>();

            // Ajouter des actions spécifiques sur un module pour un rôle
            void Add(string role, string module, params string[] actionCodes)
            {
                foreach (var ac in actionCodes)
                    perms.Add(new Permission
                    {
                        Id = Guid.NewGuid().ToString(),
                        RoleId = Ro(role),
                        ModuleId = M(module),
                        ActionId = A(ac),
                    });
            }

            // Toutes les actions (view, create, edit, delete, export, manage)
            void AddAll(string role, string module)
                => Add(role, module, "view", "create", "edit", "delete", "export", "manage");

            // Lecture + Export seulement
            void AddViewExport(string role, string module)
                => Add(role, module, "view", "export");

            // Lecture + Écriture + Modification + Export (sans suppression)
            void AddWritable(string role, string module)
                => Add(role, module, "view", "create", "edit", "export");

            // ──────────────────────────────────────────────────────────
            // SUPER ADMIN — accès total à tous les modules
            // ──────────────────────────────────────────────────────────
            foreach (var modCode in modules.Keys)
                AddAll("Super Admin", modCode);

            // ──────────────────────────────────────────────────────────
            // ADMIN
            //   • Modules métier   → accès total
            //   • dashboard        → view + export
            //   • statistiques     → view + export
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[]
            {
                "cartographie", "pdca", "clauses", "controles", "documentation",
                "risques", "audit", "actifs", "sensibilisation", "incidents",
                "users", "societes", "holdings", "roles", "config"
            })
                AddAll("Admin", mod);

            AddViewExport("Admin", "dashboard");
            AddViewExport("Admin", "statistiques");

            // ──────────────────────────────────────────────────────────
            // CONSULTANT — lecture + export sur tous les modules métier
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[]
            {
                "dashboard", "cartographie", "pdca", "clauses", "controles",
                "documentation", "risques", "audit", "actifs",
                "sensibilisation", "incidents", "statistiques"
            })
                AddViewExport("Consultant", mod);

            // ──────────────────────────────────────────────────────────
            // AUDITEUR
            //   • Modules consultation      → view + export
            //   • Modules actions correctives → view + create + edit + export
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[]
                { "dashboard", "cartographie", "clauses", "documentation", "actifs", "sensibilisation", "statistiques" })
                AddViewExport("Auditeur", mod);

            foreach (var mod in new[] { "pdca", "controles", "risques", "audit", "incidents" })
                AddWritable("Auditeur", mod);

            // ──────────────────────────────────────────────────────────
            // RSSI
            //   • Modules sécurité → accès total
            //   • Autres modules   → view + export
            //   • users            → view + create + edit + export
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[]
                { "pdca", "controles", "documentation", "risques", "audit", "actifs", "sensibilisation", "incidents" })
                AddAll("RSSI", mod);

            foreach (var mod in new[] { "dashboard", "cartographie", "clauses", "statistiques" })
                AddViewExport("RSSI", mod);

            AddWritable("RSSI", "users");

            // ──────────────────────────────────────────────────────────
            // DSI
            //   • Modules techniques → accès total
            //   • Autres modules     → view + export
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[] { "actifs", "incidents", "risques", "audit", "sensibilisation" })
                AddAll("DSI", mod);

            foreach (var mod in new[]
                { "dashboard", "cartographie", "pdca", "clauses", "controles", "documentation", "statistiques" })
                AddViewExport("DSI", mod);

            // ──────────────────────────────────────────────────────────
            // DRH
            //   • Modules RH     → accès total
            //   • Autres modules → view + export
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[] { "sensibilisation", "users", "incidents" })
                AddAll("DRH", mod);

            foreach (var mod in new[]
            {
                "dashboard", "cartographie", "pdca", "clauses",
                "controles", "documentation", "risques", "audit", "actifs", "statistiques"
            })
                AddViewExport("DRH", mod);

            // ──────────────────────────────────────────────────────────
            // EMPLOYÉ — lecture uniquement sur modules de base
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[] { "dashboard", "sensibilisation", "incidents" })
                Add("Employé", mod, "view");

            // ──────────────────────────────────────────────────────────
            // UTILISATEUR STANDARD — lecture + export sur modules de base
            // ──────────────────────────────────────────────────────────
            foreach (var mod in new[]
                { "dashboard", "cartographie", "clauses", "documentation", "sensibilisation" })
                AddViewExport("Utilisateur Standard", mod);

            await db.Permissions.AddRangeAsync(perms);
            await db.SaveChangesAsync();
            Console.WriteLine($"✅ {perms.Count} permissions créées.");
        }

        // ============================================================
        // ÉTAPE 5 — CONTRÔLES ISO 27001
        // ============================================================

        public static async Task SeedControlesAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();

            if (await dbContext.Controles.AnyAsync())
            {
                Console.WriteLine("ℹ️  Contrôles déjà présents — seed ignoré.");
                return;
            }

            // Chercher le fichier JSON à différents emplacements
            var candidatePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "controles.json"),
                Path.Combine(AppContext.BaseDirectory, "Infrastructure", "SeedData", "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "backend", "backend", "Infrastructure", "SeedData", "controles.json"),
            };

            var jsonPath = candidatePaths.FirstOrDefault(File.Exists);
            if (string.IsNullOrWhiteSpace(jsonPath))
            {
                Console.WriteLine("⚠️  Fichier controles.json non trouvé. Chemins testés :");
                foreach (var path in candidatePaths)
                    Console.WriteLine($"   - {path}");
                return;
            }

            Console.WriteLine($"📄 Fichier trouvé : {jsonPath}");

            try
            {
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
                };

                var jsonContent = await File.ReadAllTextAsync(jsonPath);
                var dtos = System.Text.Json.JsonSerializer.Deserialize<List<ControleDto>>(jsonContent, options);

                if (dtos is null || dtos.Count == 0)
                {
                    Console.WriteLine("⚠️  Aucune donnée trouvée dans controles.json.");
                    return;
                }

                var controles = dtos.Select(dto => new Controle
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
                    DernierModificateurNom = dto.DernierModificateurNom,
                }).ToList();

                await dbContext.Controles.AddRangeAsync(controles);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ {controles.Count} contrôles ISO 27001 insérés.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur seed contrôles : {ex.Message}");
                Console.WriteLine($"   Stack trace : {ex.StackTrace}");
            }
        }

        // ============================================================
        // ÉTAPE 6 — UTILISATEURS SYSTÈME
        // ============================================================

        private static async Task SeedUsersAsync(
            UserManager<ApplicationUser> userManager,
            IConfiguration config)
        {
            // Liste complète des utilisateurs à créer
            var users = new[]
            {
                // ── Administrateur (Admin) ──────────────────────────────────────
                new { Email = "admin@alexsys.com",    Password = "Admin@123456!",    NomComplet = "Administrateur Système", Role = "Admin" },

                // ── Super Admin ──────────────────────────────────────────────────
                new { Email = "boumlalilham@gmail.com",  Password = "Admin@123456!",    NomComplet = "Ilham Boumlal",          Role = "Super Admin" },

              
                // ── Métier ────────────────────────────────────────────────────────
                new { Email = "rssi@gmail.com",          Password = "Rssi@123456!",     NomComplet = "RSSI Système",           Role = "RSSI" },
                new { Email = "consultant@gmail.com",    Password = "Consul@123456!",   NomComplet = "Consultant Système",     Role = "Consultant" },
                new { Email = "auditeur@gmail.com",      Password = "Auditeur@123456!", NomComplet = "Auditeur Système",       Role = "Auditeur" },
            };

            foreach (var u in users)
                await SeedUserIfMissingAsync(userManager, u.Email, u.Password, u.NomComplet, u.Role);

            Console.WriteLine("✅ Utilisateurs système initialisés.");
        }

        // ============================================================
        // ÉTAPE 7 — DÉMO RBAC (utilisateurs démo + documents)
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
                new DemoUserSeed("rssi.demo@smsi.local",    "RssiDemo@123",    "RSSI Demo",    "RSSI"   ),
                new DemoUserSeed("drh.demo@smsi.local",     "DrhDemo@123",     "DRH Demo",     "DRH"    ),
                new DemoUserSeed("dsi.demo@smsi.local",     "DsiDemo@123",     "DSI Demo",     "DSI"    ),
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
            Console.WriteLine("✅ Documentation démo seed terminée.");
        }

        // ============================================================
        // HELPER — créer un utilisateur s'il est absent
        // ============================================================

        private static async Task SeedUserIfMissingAsync(
            UserManager<ApplicationUser> userManager,
            string email, string password, string nomComplet, string role)
        {
            if (await userManager.FindByEmailAsync(email) is not null)
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
                    Console.WriteLine($"⚠️  Utilisateur créé mais rôle non assigné ({email}) : " +
                                      $"{string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
            }
            else
            {
                Console.WriteLine($"❌ Erreur création utilisateur {email} : " +
                                  $"{string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        // ============================================================
        // HELPER — créer / mettre à jour un utilisateur démo
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
                        $"Impossible de créer l'utilisateur démo {seed.Email} : " +
                        $"{string.Join(", ", createResult.Errors.Select(e => e.Description))}");

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
                            $"Impossible de mettre à jour l'utilisateur démo {seed.Email} : " +
                            $"{string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                }

                // Réinitialiser le mot de passe
                var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await userManager.ResetPasswordAsync(user, resetToken, seed.Password);

                if (!resetResult.Succeeded && !await userManager.HasPasswordAsync(user))
                {
                    var addPwdResult = await userManager.AddPasswordAsync(user, seed.Password);
                    if (!addPwdResult.Succeeded)
                        throw new InvalidOperationException(
                            $"Impossible de définir le mot de passe démo pour {seed.Email} : " +
                            $"{string.Join(", ", addPwdResult.Errors.Select(e => e.Description))}");
                }
            }

            // Réassigner le rôle proprement
            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                    throw new InvalidOperationException(
                        $"Impossible de réinitialiser les rôles pour {seed.Email} : " +
                        $"{string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
            }

            var addRoleResult = await userManager.AddToRoleAsync(user, seed.Role);
            if (!addRoleResult.Succeeded)
                throw new InvalidOperationException(
                    $"Impossible d'assigner le rôle {seed.Role} à {seed.Email} : " +
                    $"{string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");

            return user;
        }
    }
}