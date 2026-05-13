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
        public DbSet<ProcessusClause> ProcessusClauses => Set<ProcessusClause>();
        public DbSet<ProcessusControle> ProcessusControles => Set<ProcessusControle>();
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
        public DbSet<CompanyRolePermissionOverride> CompanyRolePermissionOverrides { get; set; }
        public DbSet<UserPermissionOverride> UserPermissionOverrides { get; set; }
        public DbSet<UserActivityLog> UserActivityLogs { get; set; }
        public DbSet<DashboardMonthlySnapshot> DashboardMonthlySnapshots { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── ConformityProof ────────────────────────────────────────────────
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

            // ── FileAttachment ─────────────────────────────────────────────────
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

            modelBuilder.Entity<ProcessusClause>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.HasIndex(p => new { p.ProcessusId, p.ClauseId }).IsUnique();
                entity.HasIndex(p => p.SocieteId);

                entity.HasOne(p => p.Processus)
                      .WithMany(p => p.ProcessusClauses)
                      .HasForeignKey(p => p.ProcessusId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Clause)
                      .WithMany()
                      .HasForeignKey(p => p.ClauseId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Societe)
                      .WithMany()
                      .HasForeignKey(p => p.SocieteId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ProcessusControle>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.HasIndex(p => new { p.ProcessusId, p.ControleId }).IsUnique();
                entity.HasIndex(p => p.SocieteId);

                entity.HasOne(p => p.Processus)
                      .WithMany(p => p.ProcessusControles)
                      .HasForeignKey(p => p.ProcessusId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Controle)
                      .WithMany()
                      .HasForeignKey(p => p.ControleId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.Societe)
                      .WithMany()
                      .HasForeignKey(p => p.SocieteId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ── ApplicationUser → Société + RBAC invariants ───────────────────
            modelBuilder.Entity<ApplicationUser>(entity =>
            {
                entity.HasOne(u => u.Societe)
                    .WithMany()
                    .HasForeignKey(u => u.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(u => u.PrimaryRoleKey)
                    .HasMaxLength(64)
                    .IsRequired()
                    .HasDefaultValue("CONSULTANT");

                entity.HasIndex(u => new { u.PrimaryRoleKey, u.IsActive })
                    .HasDatabaseName("IX_AspNetUsers_PrimaryRoleKey_IsActive");

                entity.HasIndex(u => u.PrimaryRoleKey)
                    .HasDatabaseName("UX_AspNetUsers_SingleActiveSuperAdmin")
                    .IsUnique()
                    .HasFilter("[PrimaryRoleKey] = 'SUPER_ADMIN' AND [IsActive] = 1");

                entity.HasIndex(u => u.SocieteId)
                    .HasDatabaseName("UX_AspNetUsers_SingleActiveAdminPerSociete")
                    .IsUnique()
                    .HasFilter("[PrimaryRoleKey] = 'ADMIN_SOCIETE' AND [IsActive] = 1 AND [SocieteId] IS NOT NULL");

                entity.ToTable(tb =>
                {
                    tb.HasCheckConstraint(
                        "CK_AspNetUsers_PrimaryRoleKey_Allowed_Active",
                        "[IsActive] = 0 OR [PrimaryRoleKey] IN ('SUPER_ADMIN','ADMIN_SOCIETE','RSSI','CONSULTANT','AUDITEUR')");

                    tb.HasCheckConstraint(
                        "CK_AspNetUsers_SocieteByPrimaryRole_Active",
                        "[IsActive] = 0 OR (([PrimaryRoleKey] = 'SUPER_ADMIN' AND [SocieteId] IS NULL) OR ([PrimaryRoleKey] <> 'SUPER_ADMIN' AND [SocieteId] IS NOT NULL))");
                });
            });

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
                entity.HasIndex(d => new { d.SocieteId, d.Processus });

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

            // ── RiskStudy ──────────────────────────────────────────────────────
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

            // ── Controle : enum → string + index ──────────────────────────────
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

            // ── ActionPlan : deux FK vers IsoClause ───────────────────────────
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

            // ── Document ───────────────────────────────────────────────────────
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

            // ── Audit ──────────────────────────────────────────────────────────
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

            // ── AuditControlStatus ────────────────────────────────────────────
            modelBuilder.Entity<AuditControlStatus>(e =>
            {
                e.HasKey(s => s.Id);
                e.Property(s => s.ControlId).IsRequired().HasMaxLength(10);
                e.Property(s => s.Statut).IsRequired().HasMaxLength(5);
                e.Property(s => s.Comment).HasMaxLength(1000);
                e.HasIndex(s => s.SocieteId);
                e.HasOne(s => s.Societe)
                 .WithMany()
                 .HasForeignKey(s => s.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // ── NonConformite ─────────────────────────────────────────────────
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

            // ── ActionCorrective ──────────────────────────────────────────────
            modelBuilder.Entity<ActionCorrective>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.Description).IsRequired().HasMaxLength(1000);
                e.Property(a => a.Responsible).HasMaxLength(200);
                e.Property(a => a.Status).IsRequired().HasMaxLength(50);
                e.HasIndex(a => a.SocieteId);
                e.HasOne(a => a.Societe)
                 .WithMany()
                 .HasForeignKey(a => a.SocieteId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // ── SimulationAudit ───────────────────────────────────────────────
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

            // ── Formation ─────────────────────────────────────────────────────
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

            // ── PlanStep ──────────────────────────────────────────────────────
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
                e.HasIndex(p => p.SocieteId);

                e.HasOne(p => p.Societe)
                    .WithMany()
                    .HasForeignKey(p => p.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Phase>(e =>
            {
                e.HasIndex(p => p.SocieteId);
                e.HasOne(p => p.Societe)
                    .WithMany()
                    .HasForeignKey(p => p.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Section>(e =>
            {
                e.HasIndex(s => s.SocieteId);
                e.HasOne(s => s.Societe)
                    .WithMany()
                    .HasForeignKey(s => s.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<PdcaItem>(e =>
            {
                e.HasIndex(i => i.SocieteId);
                e.HasOne(i => i.Societe)
                    .WithMany()
                    .HasForeignKey(i => i.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ControleHistorique>(e =>
            {
                e.HasIndex(h => h.SocieteId);
                e.HasOne(h => h.Societe)
                    .WithMany()
                    .HasForeignKey(h => h.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<FormationParticipant>(e =>
            {
                e.HasKey(p => p.Id);
                e.HasIndex(p => p.SocieteId);
                e.HasOne(p => p.Societe)
                    .WithMany()
                    .HasForeignKey(p => p.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<FormationDocument>(e =>
            {
                e.HasKey(d => d.Id);
                e.HasIndex(d => d.SocieteId);
                e.HasOne(d => d.Societe)
                    .WithMany()
                    .HasForeignKey(d => d.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<FormationNotification>(e =>
            {
                e.HasKey(n => n.Id);
                e.HasIndex(n => n.SocieteId);
                e.HasOne(n => n.Societe)
                    .WithMany()
                    .HasForeignKey(n => n.SocieteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

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

            modelBuilder.Entity<CompanyRolePermissionOverride>(entity =>
            {
                entity.ToTable("CompanyRolePermissionOverrides", tb =>
                {
                    tb.HasCheckConstraint(
                        "CK_CompanyRolePermissionOverrides_RoleKey",
                        "[RoleKey] IN ('SUPER_ADMIN','ADMIN_SOCIETE','RSSI','CONSULTANT','AUDITEUR')");
                });
                entity.HasKey(x => x.Id);

                entity.Property(x => x.RoleKey).HasMaxLength(64).IsRequired();
                entity.Property(x => x.ModuleId).HasMaxLength(450).IsRequired();
                entity.Property(x => x.ActionId).HasMaxLength(450).IsRequired();

                entity.HasIndex(x => new { x.SocieteId, x.RoleKey, x.ModuleId, x.ActionId })
                    .IsUnique();
                entity.HasIndex(x => new { x.SocieteId, x.RoleKey });

                entity.HasOne(x => x.Societe)
                    .WithMany()
                    .HasForeignKey(x => x.SocieteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Module)
                    .WithMany()
                    .HasForeignKey(x => x.ModuleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Action)
                    .WithMany()
                    .HasForeignKey(x => x.ActionId)
                    .OnDelete(DeleteBehavior.Cascade);

            });

            modelBuilder.Entity<UserPermissionOverride>(entity =>
            {
                entity.ToTable("UserPermissionOverrides");
                entity.HasKey(x => x.Id);

                entity.Property(x => x.ModuleId).HasMaxLength(450).IsRequired();
                entity.Property(x => x.ActionId).HasMaxLength(450).IsRequired();
                entity.Property(x => x.Reason).HasMaxLength(500);

                entity.HasIndex(x => new { x.UserId, x.ModuleId, x.ActionId })
                    .IsUnique();
                entity.HasIndex(x => new { x.SocieteId, x.UserId });

                entity.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Societe)
                    .WithMany()
                    .HasForeignKey(x => x.SocieteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Module)
                    .WithMany()
                    .HasForeignKey(x => x.ModuleId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Action)
                    .WithMany()
                    .HasForeignKey(x => x.ActionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<UserActivityLog>(entity =>
            {
                entity.ToTable("UserActivityLogs");
                entity.HasKey(x => x.Id);

                entity.Property(x => x.UserId).HasMaxLength(450);
                entity.Property(x => x.UserFullName).HasMaxLength(200).IsRequired();
                entity.Property(x => x.UserEmail).HasMaxLength(256).IsRequired();
                entity.Property(x => x.UserRole).HasMaxLength(100).IsRequired();
                entity.Property(x => x.ModuleCode).HasMaxLength(64).IsRequired();
                entity.Property(x => x.ActionCode).HasMaxLength(32).IsRequired();
                entity.Property(x => x.HttpMethod).HasMaxLength(12).IsRequired();
                entity.Property(x => x.Path).HasMaxLength(512).IsRequired();
                entity.Property(x => x.QueryString).HasMaxLength(1024);
                entity.Property(x => x.TargetType).HasMaxLength(128);
                entity.Property(x => x.TargetId).HasMaxLength(128);
                entity.Property(x => x.Description).HasMaxLength(1000);
                entity.Property(x => x.IpAddress).HasMaxLength(64);
                entity.Property(x => x.UserAgent).HasMaxLength(512);
                entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(x => x.SocieteId);
                entity.HasIndex(x => x.UserId);
                entity.HasIndex(x => x.CreatedAt);
                entity.HasIndex(x => new { x.SocieteId, x.CreatedAt });
                entity.HasIndex(x => new { x.SocieteId, x.ActionCode });
                entity.HasIndex(x => new { x.SocieteId, x.ModuleCode });

                entity.HasOne(x => x.Societe)
                    .WithMany()
                    .HasForeignKey(x => x.SocieteId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DashboardMonthlySnapshot>(entity =>
            {
                entity.ToTable("DashboardMonthlySnapshots");
                entity.HasKey(x => x.Id);

                entity.HasIndex(x => new { x.SocieteId, x.MonthStartUtc })
                    .IsUnique();

                entity.HasIndex(x => x.MonthStartUtc);
                entity.HasIndex(x => x.SocieteId);

                entity.Property(x => x.MonthStartUtc).IsRequired();
                entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(x => x.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(x => x.Societe)
                    .WithMany()
                    .HasForeignKey(x => x.SocieteId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

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
