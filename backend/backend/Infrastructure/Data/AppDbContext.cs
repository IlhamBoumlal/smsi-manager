using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Holding> Holdings { get; set; }
        public DbSet<Societe> Societes { get; set; }
        public DbSet<Controle> Controles { get; set; }
        public DbSet<Actif> Actifs { get; set; }
        public DbSet<DocumentationDocument> DocumentationDocuments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuration Utilisateur -> Société
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Societe)
                .WithMany()
                .HasForeignKey(u => u.SocieteId);

            // Configuration des Enums en String pour la DB
            modelBuilder.Entity<Controle>()
                .Property(c => c.Domaine)
                .HasConversion<string>();

            modelBuilder.Entity<Controle>()
                .Property(c => c.Statut)
                .HasConversion<string>();

            // Index pour recherche rapide par Code (ex: A.5.1)
            modelBuilder.Entity<Controle>()
                .HasIndex(c => c.Code);

            modelBuilder.Entity<DocumentationDocument>()
                .ToTable("documentation_documents");

            modelBuilder.Entity<DocumentationDocument>()
                .HasIndex(d => d.UpdatedAt);

            // ─── SEEDING DES CONTROLES VIA JSON ──────────────────────────────────
            SeedControles(modelBuilder);
            modelBuilder.Entity<Controle>().ToTable("controles");
        }

        private void SeedControles(ModelBuilder modelBuilder)
        {
            // Chemin vers le fichier JSON (dans le dossier Data/SeedData)
            var basePath = AppContext.BaseDirectory;
            var projectPath = Path.GetFullPath(Path.Combine(basePath, "..", "..", ".."));
            var filePath = Path.Combine(projectPath, "Infrastructure", "SeedData", "controles.json");

            if (!File.Exists(filePath))
            {
                // Fallback pour l'environnement de développement
                filePath = Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json");
            }

            if (File.Exists(filePath))
            {
                try
                {
                    var jsonString = File.ReadAllText(filePath);

                    // Configuration de la désérialisation pour ignorer la casse
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        Converters = { new JsonStringEnumConverter() }
                    };

                    var controles = JsonSerializer.Deserialize<List<Controle>>(jsonString, options);

                    if (controles != null)
                    {
                        // Préparer les données avec des GUID fixes et déterministes
                        var seedData = new List<Controle>();

                        foreach (var c in controles)
                        {
                            // S'assurer que tous les champs requis ont des valeurs
                            var controle = new Controle
                            {
                                Id = GenerateGuidFromCode(c.Code), // GUID fixe basé sur le code
                                Code = c.Code,
                                Titre = c.Titre,
                                Description = c.Description,
                                Domaine = c.Domaine,
                                Applicable = c.Applicable,
                                JustificationApplicabilite = c.JustificationApplicabilite ?? string.Empty,
                                Statut = c.Statut,
                                Preuves = c.Preuves ?? string.Empty,
                                Responsable = c.Responsable ?? string.Empty,
                                ReferenceDocument = c.ReferenceDocument ?? string.Empty,
                                DateMiseAJour = DateTime.SpecifyKind(c.DateMiseAJour, DateTimeKind.Utc),
                                SocieteId = c.SocieteId
                            };

                            seedData.Add(controle);
                        }

                        modelBuilder.Entity<Controle>().HasData(seedData);
                    }
                }
                catch (Exception ex)
                {
                    // En développement, on peut voir l'erreur
                    Console.WriteLine($"Erreur lors du seeding JSON : {ex.Message}");
                    throw; // En développement, on veut voir l'erreur
                }
            }
            else
            {
                throw new FileNotFoundException($"Le fichier de seed n'a pas été trouvé : {filePath}");
            }
        }

        // Méthode utilitaire pour générer un GUID fixe à partir du code (A.5.1 etc.)
        private static Guid GenerateGuidFromCode(string code)
        {
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(code));
                return new Guid(hash);
            }
        }
    }
}
