using backend.Domain.Entities;
using backend.Domain.Enumerations;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Action = backend.Domain.Entities.Action;

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
        public DbSet<RiskStudy> RiskStudies { get; set; }
        public DbSet<IsoClause> IsoClauses { get; set; }
        public DbSet<ConformityStatus> ConformityStatuses { get; set; }
        public DbSet<ActionPlan> ActionPlans { get; set; }
        public DbSet<PdcaCycle> PdcaCycles { get; set; }
        public DbSet<PdcaItem> PdcaItems { get; set; }
        public DbSet<Phase> Phases { get; set; }
        public DbSet<PlanStep> PlanSteps { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<ConformityProof> ConformityProofs => Set<ConformityProof>();
        public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
        public DbSet<Processus> Processus => Set<Processus>();
        public DbSet<Document> Documents => Set<Document>();
        public DbSet<Audit> Audits { get; set; }
        public DbSet<AuditControlStatus> AuditControlStatuses { get; set; }
        public DbSet<NonConformite> NonConformites { get; set; }
        public DbSet<ActionCorrective> ActionsCorrectives { get; set; }
        public DbSet<SimulationAudit> SimulationAudits { get; set; }
        public DbSet<Formation> Formations { get; set; }
        public DbSet<FormationParticipant> FormationParticipants { get; set; }
        public DbSet<FormationDocument> FormationDocuments { get; set; }
        public DbSet<FormationNotification> FormationNotifications { get; set; }
        public DbSet<Profil> Profils { get; set; }
        public DbSet<ControleHistorique> ControleHistoriques { get; set; }
        public DbSet<Incident> Incidents { get; set; }
        public DbSet<Module> Modules { get; set; }
        public DbSet<Action> Actions { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // â”€â”€ ConformityProof â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<ConformityProof>(e =>
            {
                e.HasKey(p => p.Id);
                e.HasOne(p => p.Clause)
                 .WithMany()
                 .HasForeignKey(p => p.IsoClauseId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(p => new { p.IsoClauseId, p.UserId });
                e.HasIndex(p => p.SocieteId);
                e.HasOne(p => p.Societe)
                 .WithMany()
                 .HasForeignKey(p => p.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // â”€â”€ FileAttachment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<FileAttachment>(e =>
            {
                e.HasKey(f => f.Id);
                e.Property(f => f.Content).IsRequired();
                e.HasIndex(f => f.SocieteId);

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

                e.HasOne(f => f.DocumentationDocument)
                 .WithMany()
                 .HasForeignKey(f => f.DocumentationDocumentId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.SetNull);

                e.HasIndex(f => f.ConformityProofId);
                e.HasIndex(f => f.ActionPlanId);
                e.HasIndex(f => f.DocumentationDocumentId);
                e.HasIndex(f => f.UserId);
                e.HasOne(f => f.Societe)
                 .WithMany()
                 .HasForeignKey(f => f.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // â”€â”€ ApplicationUser â†’ SociÃ©tÃ© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Societe)
                .WithMany()
                .HasForeignKey(u => u.SocieteId);

            // ── PDCA cycles ───────────────────────────────────────────────────────────────────
            modelBuilder.Entity<PdcaCycle>(entity =>
            {
                entity.ToTable("PdcaCycles");
                entity.HasIndex(c => c.SocieteId);

                entity.HasOne(c => c.Societe)
                    .WithMany()
                    .HasForeignKey(c => c.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ── DocumentationDocument ──────────────────────────────────────────
            modelBuilder.Entity<DocumentationDocument>(entity =>
            {
                entity.ToTable("DocumentationDocuments");
                entity.HasIndex(d => d.UpdatedAt);
                entity.HasIndex(d => new { d.SocieteId, d.Status });
                entity.HasIndex(d => new { d.SocieteId, d.Category });
                entity.HasIndex(d => new { d.SocieteId, d.FileHash });

                entity.HasOne(d => d.Societe)
                    .WithMany()
                    .HasForeignKey(d => d.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(d => d.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(d => d.LastModifiedByUser)
                    .WithMany()
                    .HasForeignKey(d => d.LastModifiedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(d => d.ApprovedByUser)
                    .WithMany()
                    .HasForeignKey(d => d.ApprovedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // â”€â”€ RiskStudy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<RiskStudy>(entity =>
            {
                entity.ToTable("RiskStudies");
                entity.HasIndex(r => r.SocieteId);
                entity.HasIndex(r => new { r.SocieteId, r.UpdatedAt });

                entity.Property(r => r.Name).HasMaxLength(200);
                entity.Property(r => r.Organization).HasMaxLength(200);
                entity.Property(r => r.Perimeter).HasMaxLength(300);
                entity.Property(r => r.Author).HasMaxLength(200);
                entity.Property(r => r.PayloadJson).HasColumnType("nvarchar(max)");

                entity.HasOne(r => r.Societe)
                    .WithMany()
                    .HasForeignKey(r => r.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(r => r.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(r => r.CreatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(r => r.LastModifiedByUser)
                    .WithMany()
                    .HasForeignKey(r => r.LastModifiedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // â”€â”€ Controle : enum â†’ string + index â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<Controle>()
                .Property(c => c.Domaine)
                .HasConversion<string>();

            modelBuilder.Entity<Controle>()
                .Property(c => c.Statut)
                .HasConversion<string>();

            modelBuilder.Entity<Controle>()
                .HasIndex(c => c.Code);

            modelBuilder.Entity<Controle>(entity =>
            {
                entity.HasIndex(c => c.SocieteId);

                entity.HasOne(c => c.Societe)
                    .WithMany()
                    .HasForeignKey(c => c.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ── Actif ──────────────────────────────────────────────────────────
            modelBuilder.Entity<Actif>(entity =>
            {
                entity.HasIndex(a => a.SocieteId);

                entity.HasOne(a => a.Societe)
                    .WithMany()
                    .HasForeignKey(a => a.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ── Incident ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Incident>(entity =>
            {
                entity.HasIndex(i => i.SocieteId);

                entity.HasOne(i => i.Societe)
                    .WithMany()
                    .HasForeignKey(i => i.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ── IsoClause : index sur Number ───────────────────────────────────
            modelBuilder.Entity<IsoClause>()
                .HasIndex(c => c.Number);

            // â”€â”€ ActionPlan : deux FK vers IsoClause â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<ActionPlan>()
                .HasKey(ap => ap.Id);  // Id is now int

            modelBuilder.Entity<ActionPlan>()
                .HasIndex(ap => ap.SocieteId);

            modelBuilder.Entity<ActionPlan>()
                .HasOne(ap => ap.Societe)
                .WithMany()
                .HasForeignKey(ap => ap.SocieteId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ActionPlan>()
                .HasOne(ap => ap.Clause)
                .WithMany(c => c.ActionPlans)
                .HasForeignKey(ap => ap.IsoClauseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ActionPlan>()
                .HasOne(ap => ap.SubClause)
                .WithMany()
                .HasForeignKey(ap => ap.SubClauseId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ConformityStatus>(entity =>
            {
                entity.HasIndex(cs => cs.SocieteId);
                entity.HasIndex(cs => new { cs.IsoClauseId, cs.UserId });
                entity.HasOne(cs => cs.Societe)
                    .WithMany()
                    .HasForeignKey(cs => cs.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ── Processus ──────────────────────────────────────────────────────
            modelBuilder.Entity<Processus>(e =>
            {
                e.HasKey(p => p.Id);
                e.Property(p => p.Categorie).HasMaxLength(10).IsRequired();
                e.Property(p => p.Nom).HasMaxLength(200).IsRequired();
                e.Property(p => p.Responsable).HasMaxLength(100);
                e.Property(p => p.Description).HasMaxLength(500);
                e.HasIndex(p => p.SocieteId);

                e.HasOne(p => p.Societe)
                    .WithMany()
                    .HasForeignKey(p => p.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasMany(p => p.Documents)
                 .WithOne(d => d.Processus)
                 .HasForeignKey(d => d.ProcessusId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // â”€â”€ Document â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<Document>(e =>
            {
                e.HasKey(d => d.Id);
                e.Property(d => d.Nom).HasMaxLength(200).IsRequired();
                e.Property(d => d.Type).HasMaxLength(50);
                e.Property(d => d.Reference).HasMaxLength(50);
                e.Property(d => d.Statut).HasMaxLength(30);
                e.Property(d => d.FichierNom).HasMaxLength(260);
                e.Property(d => d.FichierType).HasMaxLength(100);
                e.Property(d => d.FichierData);
                e.HasIndex(d => d.SocieteId);

                e.HasOne(d => d.Societe)
                    .WithMany()
                    .HasForeignKey(d => d.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // â”€â”€ Audit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<Audit>(e =>
            {
                e.HasKey(a => a.Id);
                e.HasIndex(a => a.SocieteId);
                e.HasIndex(a => new { a.SocieteId, a.UpdatedAt });

                e.Property(a => a.Title).IsRequired().HasMaxLength(300);
                e.Property(a => a.Type).IsRequired().HasMaxLength(50);
                e.Property(a => a.Status).IsRequired().HasMaxLength(50);
                e.Property(a => a.Auditor).IsRequired().HasMaxLength(200);
                e.Property(a => a.Org).IsRequired().HasMaxLength(200);
                e.Property(a => a.Rssi).HasMaxLength(200);
                e.Property(a => a.Approver).HasMaxLength(200);
                e.Property(a => a.Scope).HasMaxLength(500);
                e.Property(a => a.Objectives).HasMaxLength(2000);
                e.Property(a => a.Author).HasMaxLength(200);
                e.Property(a => a.Date).HasMaxLength(10);

                e.HasOne(a => a.Societe)
                 .WithMany()
                 .HasForeignKey(a => a.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);

                e.HasMany(a => a.ControlStatuses)
                 .WithOne(s => s.Audit)
                 .HasForeignKey(s => s.AuditId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasMany(a => a.NonConformites)
                 .WithOne(n => n.Audit)
                 .HasForeignKey(n => n.AuditId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // â”€â”€ AuditControlStatus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<AuditControlStatus>(e =>
            {
                e.HasKey(s => s.Id);
                e.Property(s => s.ControlId).IsRequired().HasMaxLength(10);
                e.Property(s => s.Statut).IsRequired().HasMaxLength(5);
                e.Property(s => s.Comment).HasMaxLength(1000);
            });

            // â”€â”€ NonConformite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<NonConformite>(e =>
            {
                e.HasKey(n => n.Id);
                e.HasIndex(n => n.SocieteId);
                e.HasIndex(n => new { n.SocieteId, n.UpdatedAt });

                e.Property(n => n.Title).IsRequired().HasMaxLength(300);
                e.Property(n => n.ControlId).IsRequired().HasMaxLength(10);
                e.Property(n => n.Status).IsRequired().HasMaxLength(50);
                e.Property(n => n.Actor).HasMaxLength(200);
                e.Property(n => n.Responsible).HasMaxLength(200);
                e.Property(n => n.AuditName).HasMaxLength(300);
                e.Property(n => n.Description).HasMaxLength(2000);
                e.Property(n => n.CorrectiveAction).HasMaxLength(2000);

                e.HasOne(n => n.Societe)
                 .WithMany()
                 .HasForeignKey(n => n.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);

                e.HasMany(n => n.CorrectiveActions)
                 .WithOne(a => a.NonConformite)
                 .HasForeignKey(a => a.NonConformiteId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // â”€â”€ ActionCorrective â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<ActionCorrective>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.Description).IsRequired().HasMaxLength(1000);
                e.Property(a => a.Responsible).HasMaxLength(200);
                e.Property(a => a.Status).IsRequired().HasMaxLength(50);
            });

            // â”€â”€ SimulationAudit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<SimulationAudit>(e =>
            {
                e.HasKey(s => s.Id);
                e.HasIndex(s => s.SocieteId);
                e.HasIndex(s => new { s.SocieteId, s.CreatedAt });

                e.Property(s => s.Name).IsRequired().HasMaxLength(300);
                e.Property(s => s.Author).HasMaxLength(200);
                e.Property(s => s.AnswersJson).IsRequired().HasColumnType("nvarchar(max)");
                e.Property(s => s.CommentsJson).IsRequired().HasColumnType("nvarchar(max)");

                e.HasOne(s => s.Societe)
                 .WithMany()
                 .HasForeignKey(s => s.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // â”€â”€ Formation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<Formation>(e =>
            {
                e.HasKey(f => f.Id);
                e.Property(f => f.Reference).IsRequired().HasMaxLength(20);
                e.Property(f => f.Title).IsRequired().HasMaxLength(200);
                e.HasIndex(f => f.SocieteId);

                e.HasOne(f => f.Societe)
                 .WithMany()
                 .HasForeignKey(f => f.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);

                e.HasMany(f => f.Participants)
                 .WithOne(p => p.Formation)
                 .HasForeignKey(p => p.FormationId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasMany(f => f.FormationDocuments)
                 .WithOne(d => d.Formation)
                 .HasForeignKey(d => d.FormationId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasMany(f => f.Notifications)
                 .WithOne(n => n.Formation)
                 .HasForeignKey(n => n.FormationId)
                 .OnDelete(DeleteBehavior.Cascade);
            });
            // Add this to your OnModelCreating method, preferably near the ActionPlan configuration:

            // â”€â”€ PlanStep â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            modelBuilder.Entity<PlanStep>(e =>
            {
                e.HasKey(p => p.Id);

                e.Property(p => p.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                e.Property(p => p.Description)
                    .HasMaxLength(1000);

                e.Property(p => p.Status)
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasDefaultValue("todo");

                e.Property(p => p.Echeance)
                    .IsRequired();

                e.Property(p => p.CreatedAt)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()");

                e.Property(p => p.UpdatedAt)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()");

                e.HasOne(p => p.ActionPlan)
                    .WithMany(ap => ap.PlanSteps) // Make sure ActionPlan has a PlanSteps collection
                    .HasForeignKey(p => p.ActionPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(p => p.ActionPlanId);
                e.HasIndex(p => p.Status);
                e.HasIndex(p => p.Echeance);
            });

            modelBuilder.Entity<FormationParticipant>().HasKey(p => p.Id);
            modelBuilder.Entity<FormationDocument>().HasKey(d => d.Id);
            modelBuilder.Entity<FormationNotification>().HasKey(n => n.Id);
            modelBuilder.Entity<Controle>().ToTable("controles");
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(p => p.Id);

                // NE METTEZ PAS de .HasDatabaseName(...) ici
                entity.HasIndex(p => new { p.RoleId, p.ModuleId, p.ActionId })
                      .IsUnique();

                entity.HasOne(p => p.Module)
                      .WithMany(m => m.Permissions)
                      .HasForeignKey(p => p.ModuleId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Action)
                      .WithMany()
                      .HasForeignKey(p => p.ActionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(p => p.RoleId);
            });
            // Index uniques
            modelBuilder.Entity<Module>()
                .HasIndex(m => m.Code)
                .IsUnique();

            modelBuilder.Entity<Action>()
                .HasIndex(a => a.Code)
                .IsUnique();

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
