using backend.Domain.Entities;
using Domain.Entities;
using Domain.Enumerations;
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
        public DbSet<IsoClause> IsoClauses { get; set; }
        public DbSet<ConformityStatus> ConformityStatuses { get; set; }
        public DbSet<ActionPlan> ActionPlans { get; set; }
        public DbSet<PdcaCycle> PdcaCycles { get; set; }
        public DbSet<PdcaItem> PdcaItems { get; set; }
        public DbSet<Phase> Phases { get; set; }
        public DbSet<PlanStep> PlanSteps { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<ConformityProof> ConformityProofs => Set<ConformityProof>();
        public DbSet<FileAttachment>   FileAttachments   => Set<FileAttachment>();
        public DbSet<Processus> Processus => Set<Processus>();
        public DbSet<Document> Documents => Set<Document>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<ConformityProof>(e =>
            {
                e.HasKey(p => p.Id);
                e.HasOne(p => p.Clause)
                 .WithMany()
                 .HasForeignKey(p => p.IsoClauseId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(p => new { p.IsoClauseId, p.UserId });
            });

            modelBuilder.Entity<FileAttachment>(e =>
            {
                e.HasKey(f => f.Id);

                // Contenu binaire — pas de limite de taille côté EF
                // SQL Server crée automatiquement varbinary(max) pour byte[]
                // PostgreSQL crée bytea
                e.Property(f => f.Content).IsRequired();

                e.HasOne(f => f.ConformityProof)
                 .WithMany(p => p.Files)
                 .HasForeignKey(f => f.ConformityProofId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(f => f.ActionPlan)
                 .WithMany()
                 .HasForeignKey(f => f.ActionPlanId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(f => f.ConformityProofId);
                e.HasIndex(f => f.ActionPlanId);
                e.HasIndex(f => f.UserId);
            });
            // ── ApplicationUser → Société ──────────────────────────────────────
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Societe)
                .WithMany()
                .HasForeignKey(u => u.SocieteId);

            // ── Controle : enum → string + index ──────────────────────────────
            modelBuilder.Entity<Controle>()
                .Property(c => c.Domaine)
                .HasConversion<string>();

            modelBuilder.Entity<Controle>()
                .Property(c => c.Statut)
                .HasConversion<string>();

            modelBuilder.Entity<Controle>()
                .HasIndex(c => c.Code);

            // ── IsoClause : index sur Number ───────────────────────────────────
            modelBuilder.Entity<IsoClause>()
                .HasIndex(c => c.Number);

            // ── ActionPlan : deux FK vers IsoClause ───────────────────────────
            //
            // EF Core ne peut pas deviner automatiquement quelle propriété de
            // navigation correspond à quelle clé étrangère quand une entité
            // possède plusieurs relations vers la même table. On les configure
            // explicitement ici.
            //
            // Relation 1 : ActionPlan.IsoClauseId → IsoClause (clause parente)
            modelBuilder.Entity<ActionPlan>()
                .HasOne(ap => ap.Clause)
                .WithMany(c => c.ActionPlans)
                .HasForeignKey(ap => ap.IsoClauseId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relation 2 : ActionPlan.SubClauseId → IsoClause (sous-clause ciblée)
            // Pas de collection inverse sur IsoClause pour cette relation.
            modelBuilder.Entity<ActionPlan>()
                .HasOne(ap => ap.SubClause)
                .WithMany()
                .HasForeignKey(ap => ap.SubClauseId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<Processus>(e =>
            {
                e.HasKey(p => p.Id);
                e.Property(p => p.Categorie).HasMaxLength(10).IsRequired();
                e.Property(p => p.Nom).HasMaxLength(200).IsRequired();
                e.Property(p => p.Responsable).HasMaxLength(100);
                e.Property(p => p.Description).HasMaxLength(500);
                e.HasMany(p => p.Documents)
                 .WithOne()
                 .HasForeignKey(d => d.ProcessusId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Document>(e =>
            {
                e.HasKey(d => d.Id);
                e.Property(d => d.Nom).HasMaxLength(200).IsRequired();
                e.Property(d => d.Type).HasMaxLength(50);
                e.Property(d => d.Reference).HasMaxLength(50);
                e.Property(d => d.Statut).HasMaxLength(30);
                e.Property(d => d.FichierNom).HasMaxLength(260);
                e.Property(d => d.FichierType).HasMaxLength(100);
                e.Property(d => d.FichierData);  // varbinary(max) en SQL Server
            });
            // ── Seeding ────────────────────────────────────────────────────────
            SeedControles(modelBuilder);
            modelBuilder.Entity<Controle>().ToTable("controles");
        }

        private void SeedControles(ModelBuilder modelBuilder)
        {
            var basePath = AppContext.BaseDirectory;
            var projectPath = Path.GetFullPath(Path.Combine(basePath, "..", "..", ".."));
            var filePath = Path.Combine(projectPath, "Infrastructure", "SeedData", "controles.json");

            if (!File.Exists(filePath))
            {
                filePath = Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json");
            }

            if (File.Exists(filePath))
            {
                try
                {
                    var jsonString = File.ReadAllText(filePath);
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        Converters = { new JsonStringEnumConverter() }
                    };

                    var controles = JsonSerializer.Deserialize<List<Controle>>(jsonString, options);

                    if (controles != null)
                    {
                        var seedData = new List<Controle>();

                        foreach (var c in controles)
                        {
                            var controle = new Controle
                            {
                                Id = GenerateGuidFromCode(c.Code),
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
                    Console.WriteLine($"Erreur lors du seeding JSON : {ex.Message}");
                    throw;
                }
            }
            else
            {
                throw new FileNotFoundException($"Le fichier de seed n'a pas été trouvé : {filePath}");
            }
        }

        private static Guid GenerateGuidFromCode(string code)
        {
            if (string.IsNullOrEmpty(code))
                return Guid.NewGuid();

            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(code));
                return new Guid(hash);
            }
        }
    }
}