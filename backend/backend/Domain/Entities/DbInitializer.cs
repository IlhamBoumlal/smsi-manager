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
        // ============================================================
        // RÔLES PRÉDÉFINIS DU SYSTÈME
        // ============================================================
        private static readonly string[] SystemRoles =
        [
            "Super Admin",
            "Admin",
            "Admin Societe",
            "RSSI",
            "Consultant",
            "Auditeur",
            "DSI",
            "DRH",
            "Employé",
            "Utilisateur Standard",
        ];

        private static readonly string[] AccountsToRemoveOnStartup =
        [
            "admin@alexsys.com",
            "rssi.demo@smsi.local",
            "drh.demo@smsi.local",
            "dsi.demo@smsi.local",
            "employe.demo@smsi.local",
        ];

        private const string AlexsysSocieteName = "Alexsys Solutions";
        private const string AlexsysSocieteLogoRelativePath = "/logos/alexsys-solutions.png";
        private const string AlexsysAdminSocieteEmail = "admin.societe@alexsys.com";
        private const string AlexsysAdminSocietePassword = "Alexsys@123456!";
        private const string AlexsysAdminSocieteFullName = "Admin Societe Alexsys";

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

            // Nettoyage systématique des comptes à supprimer.
            await RemoveDeprecatedAccountsAsync(dbContext, userManager);

            // ══════════════════════════════════════════════════════════════
            //  TOUTES LES INITIALISATIONS SONT ACTIVES
            // ══════════════════════════════════════════════════════════════

            // ÉTAPE 1 : Rôles
            await SeedRolesAsync(roleManager);

            // ÉTAPE 2 : Actions
           await SeedActionsAsync(dbContext);

            // ÉTAPE 3 : Modules
            await SeedModulesAsync(dbContext);

            // ÉTAPE 4 : Permissions
            await SeedPermissionsAsync(dbContext);

            // ÉTAPE 5 : Contrôles ISO 27001 (depuis fichier JSON)
            await SeedControlesAsync(serviceProvider);

            // ÉTAPE 6 : Utilisateurs système
            await SeedUsersAsync(userManager, config);

            // ÉTAPE 7 : Compte Admin Societe Alexsys
            await EnsureAlexsysAdminSocieteAccountAsync(dbContext, userManager, environment);

            // ÉTAPE 8 : Démo RBAC
            // Désactivé définitivement : comptes supprimés via RemoveDeprecatedAccountsAsync.

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
                // ── Super Admin ──────────────────────────────────────────────────
                new { Email = "boumlalilham@gmail.com",  Password = "Admin@123456!",    NomComplet = "Ilham Boumlal",          Role = "Super Admin" },

              
                // ── Métier ────────────────────────────────────────────────────────
                new { Email = "rssi@gmail.com",          Password = "Rssi@123456!",     NomComplet = "RSSI Système",           Role = "RSSI" },
                new { Email = "consultant@gmail.com",    Password = "Consul@123456!",   NomComplet = "Consultant Système",     Role = "Consultant" },
                new { Email = "auditeur@gmail.com",      Password = "Auditeur@123456!", NomComplet = "Auditeur Système",       Role = "Auditeur" },
            };

            foreach (var u in users)
                await EnsureSystemUserAsync(userManager, u.Email, u.Password, u.NomComplet, u.Role);

            Console.WriteLine("✅ Utilisateurs système initialisés.");
        }

        private static async Task EnsureAlexsysAdminSocieteAccountAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment environment)
        {
            EnsureAlexsysLogoFile(environment);

            var societe = await dbContext.Societes
                .FirstOrDefaultAsync(s => s.Nom.ToLower() == AlexsysSocieteName.ToLower());

            if (societe is null)
            {
                societe = new Societe
                {
                    Nom = AlexsysSocieteName,
                    Logo = AlexsysSocieteLogoRelativePath
                };

                await dbContext.Societes.AddAsync(societe);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ Société créée : {AlexsysSocieteName}");
            }
            else
            {
                if (!string.Equals(societe.Logo, AlexsysSocieteLogoRelativePath, StringComparison.OrdinalIgnoreCase))
                {
                    societe.Logo = AlexsysSocieteLogoRelativePath;
                    await dbContext.SaveChangesAsync();
                }

                Console.WriteLine($"ℹ️ Société existante : {AlexsysSocieteName}");
            }

            await EnsureSystemUserAsync(
                userManager,
                AlexsysAdminSocieteEmail,
                AlexsysAdminSocietePassword,
                AlexsysAdminSocieteFullName,
                "Admin Societe",
                societe.Id);

            Console.WriteLine($"✅ Compte Admin Societe prêt : {AlexsysAdminSocieteEmail}");
        }

        private static void EnsureAlexsysLogoFile(IWebHostEnvironment environment)
        {
            var targetDirectory = Path.Combine(environment.ContentRootPath, "wwwroot", "logos");
            Directory.CreateDirectory(targetDirectory);

            var targetPath = Path.Combine(targetDirectory, "alexsys-solutions.png");
            if (File.Exists(targetPath))
            {
                return;
            }

            var sourcePath = Path.GetFullPath(
                Path.Combine(environment.ContentRootPath, "..", "..", "frontend", "public", "iso-logo.png"));

            if (!File.Exists(sourcePath))
            {
                Console.WriteLine("⚠️ Logo source introuvable pour Alexsys Solutions, société créée sans copie de fichier logo.");
                return;
            }

            File.Copy(sourcePath, targetPath, overwrite: true);
        }

        // ============================================================
        // ÉTAPE 7 — NETTOYAGE DES COMPTES À SUPPRIMER
        // ============================================================

        private static async Task RemoveDeprecatedAccountsAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager)
        {
            var demoUsers = await userManager.Users
                .Where(u => u.Email != null && AccountsToRemoveOnStartup.Contains(u.Email))
                .ToListAsync();

            if (demoUsers.Count == 0)
            {
                Console.WriteLine("ℹ️ Aucun compte à supprimer.");
                return;
            }

            var demoUserIds = demoUsers.Select(u => u.Id).ToList();

            var docs = await dbContext.DocumentationDocuments
                .Where(d =>
                    (d.CreatedByUserId != null && demoUserIds.Contains(d.CreatedByUserId)) ||
                    (d.LastModifiedByUserId != null && demoUserIds.Contains(d.LastModifiedByUserId)) ||
                    (d.ApprovedByUserId != null && demoUserIds.Contains(d.ApprovedByUserId)))
                .ToListAsync();

            foreach (var doc in docs)
            {
                if (doc.CreatedByUserId != null && demoUserIds.Contains(doc.CreatedByUserId))
                    doc.CreatedByUserId = null;

                if (doc.LastModifiedByUserId != null && demoUserIds.Contains(doc.LastModifiedByUserId))
                    doc.LastModifiedByUserId = null;

                if (doc.ApprovedByUserId != null && demoUserIds.Contains(doc.ApprovedByUserId))
                    doc.ApprovedByUserId = null;
            }

            var studies = await dbContext.RiskStudies
                .Where(s =>
                    (s.CreatedByUserId != null && demoUserIds.Contains(s.CreatedByUserId)) ||
                    (s.LastModifiedByUserId != null && demoUserIds.Contains(s.LastModifiedByUserId)))
                .ToListAsync();

            foreach (var study in studies)
            {
                if (study.CreatedByUserId != null && demoUserIds.Contains(study.CreatedByUserId))
                    study.CreatedByUserId = null;

                if (study.LastModifiedByUserId != null && demoUserIds.Contains(study.LastModifiedByUserId))
                    study.LastModifiedByUserId = null;
            }

            if (docs.Count > 0 || studies.Count > 0)
                await dbContext.SaveChangesAsync();

            var deletedCount = 0;
            foreach (var demoUser in demoUsers)
            {
                var roles = await userManager.GetRolesAsync(demoUser);
                if (roles.Count > 0)
                    await userManager.RemoveFromRolesAsync(demoUser, roles);

                var deleteResult = await userManager.DeleteAsync(demoUser);
                if (deleteResult.Succeeded)
                {
                    deletedCount++;
                }
                else
                {
                    Console.WriteLine($"❌ Suppression impossible ({demoUser.Email}) : {string.Join(", ", deleteResult.Errors.Select(e => e.Description))}");
                }
            }

            Console.WriteLine($"✅ Nettoyage comptes supprimés terminé : {deletedCount}/{demoUsers.Count} comptes supprimés.");
        }

        // ============================================================
        // HELPER — créer / mettre à jour un utilisateur système
        // ============================================================

        private static async Task EnsureSystemUserAsync(
            UserManager<ApplicationUser> userManager,
            string email, string password, string nomComplet, string role)
            => await EnsureSystemUserAsync(userManager, email, password, nomComplet, role, null);

        private static async Task EnsureSystemUserAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string password,
            string nomComplet,
            string role,
            int? societeId)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    NomComplet = nomComplet,
                    EmailConfirmed = true,
                    IsActive = true,
                    SocieteId = societeId,
                    CreatedAt = DateTime.UtcNow,
                };

                var createResult = await userManager.CreateAsync(user, password);
                if (!createResult.Succeeded)
                {
                    Console.WriteLine($"❌ Erreur création utilisateur {email} : " +
                                      $"{string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                    return;
                }
            }
            else
            {
                var changed = false;
                if (!string.Equals(user.NomComplet, nomComplet, StringComparison.Ordinal))
                { user.NomComplet = nomComplet; changed = true; }

                if (!user.EmailConfirmed)
                { user.EmailConfirmed = true; changed = true; }

                if (!user.IsActive)
                { user.IsActive = true; changed = true; }

                if (user.SocieteId != societeId)
                { user.SocieteId = societeId; changed = true; }

                if (changed)
                    await userManager.UpdateAsync(user);
            }

            // Aligne le mot de passe seed (utile en local après reset DB)
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, resetToken, password);
            if (!resetResult.Succeeded && !await userManager.HasPasswordAsync(user))
            {
                await userManager.AddPasswordAsync(user, password);
            }

            // Aligne le rôle
            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
                await userManager.RemoveFromRolesAsync(user, currentRoles);

            var roleResultFinal = await userManager.AddToRoleAsync(user, role);
            if (roleResultFinal.Succeeded)
                Console.WriteLine($"✅ Utilisateur prêt : {email}  →  rôle [{role}]");
            else
                Console.WriteLine($"⚠️ Impossible d'assigner le rôle [{role}] à {email} : " +
                                  $"{string.Join(", ", roleResultFinal.Errors.Select(e => e.Description))}");
        }

    }
}
