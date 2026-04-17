using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class fusion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Actifs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Categorie = table.Column<int>(type: "int", nullable: false),
                    Classification = table.Column<int>(type: "int", nullable: false),
                    ProprietaireId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Actifs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Audits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Auditor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Org = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Rssi = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Approver = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Scope = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Objectives = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Date = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Audits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "controles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Titre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Domaine = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Applicable = table.Column<bool>(type: "bit", nullable: false),
                    RaisonsApplicabilite = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RaisonExclusion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JustificationConformite = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Remarque = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Preuves = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Steps = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Priorite = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StatutPlan = table.Column<int>(type: "int", nullable: true),
                    ResponsablePlan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateEcheance = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DateMiseAJour = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DernierModificateurId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DernierModificateurNom = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_controles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Formations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Objectif = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Mode = table.Column<int>(type: "int", nullable: false),
                    DateDebut = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Duree = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Formateur = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FormateurType = table.Column<int>(type: "int", nullable: false),
                    Departement = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    LmsLink = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NotifInvit = table.Column<bool>(type: "bit", nullable: false),
                    NotifRappel = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SocieteId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Holdings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holdings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Incidents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Titre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Priorite = table.Column<int>(type: "int", nullable: true),
                    Declarant = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Statut = table.Column<int>(type: "int", nullable: true),
                    Resolution = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IsoClauses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Number = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IsoClauses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IsoClauses_IsoClauses_ParentId",
                        column: x => x.ParentId,
                        principalTable: "IsoClauses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PdcaCycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PdcaCycles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Processus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Categorie = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Responsable = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Processus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Profils",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Profils", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SimulationAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Author = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    TotalAnswered = table.Column<int>(type: "int", nullable: false),
                    TotalOui = table.Column<int>(type: "int", nullable: false),
                    TotalNon = table.Column<int>(type: "int", nullable: false),
                    AnswersJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CommentsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulationAudits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditControlStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuditId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ControlId = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditControlStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditControlStatuses_Audits_AuditId",
                        column: x => x.AuditId,
                        principalTable: "Audits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NonConformites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ControlId = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Actor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CorrectiveAction = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Responsible = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Deadline = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AuditName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    AuditId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NonConformites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NonConformites_Audits_AuditId",
                        column: x => x.AuditId,
                        principalTable: "Audits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ControleHistoriques",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ControleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DateModification = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModificateurId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModificateurNom = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AvantJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApresJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChampsModifies = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ControleHistoriques", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ControleHistoriques_controles_ControleId",
                        column: x => x.ControleId,
                        principalTable: "controles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormationDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormationDocuments_Formations_FormationId",
                        column: x => x.FormationId,
                        principalTable: "Formations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormationNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecipientCount = table.Column<int>(type: "int", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormationNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormationNotifications_Formations_FormationId",
                        column: x => x.FormationId,
                        principalTable: "Formations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormationParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Initials = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvatarColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormationParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormationParticipants_Formations_FormationId",
                        column: x => x.FormationId,
                        principalTable: "Formations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Societes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HoldingId = table.Column<int>(type: "int", nullable: true),
                    Logo = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Societes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Societes_Holdings_HoldingId",
                        column: x => x.HoldingId,
                        principalTable: "Holdings",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ActionPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsoClauseId = table.Column<int>(type: "int", nullable: false),
                    SubClauseId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Version = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DateDetection = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SourceDetection = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ClauseIso = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Gravite = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DescriptionNc = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    SpecificFieldsJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: true),
                    ResponsableImmediat = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MesureImmediate = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    PreuvesImmediatesJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    AnalyseCausesRacines = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CausePrincipale = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CausesSecondairesJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    DocumentAProduire = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PeriodiciteRevision = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    EnjeuxInternesJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    EnjeuxExternesJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    EtapesPlanActionJson = table.Column<string>(type: "nvarchar(max)", maxLength: 16000, nullable: false),
                    DateEcheanceGlobale = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponsablePlan = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RessourcesNecessaires = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    MethodesVerificationJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    DateVerification = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResultatsObtenus = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    PiecesJointesJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PlanCloture = table.Column<bool>(type: "bit", nullable: false),
                    DateCloture = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Validateur = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActionPlans_IsoClauses_IsoClauseId",
                        column: x => x.IsoClauseId,
                        principalTable: "IsoClauses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ActionPlans_IsoClauses_SubClauseId",
                        column: x => x.SubClauseId,
                        principalTable: "IsoClauses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ConformityProofs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsoClauseId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConformityProofs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConformityProofs_IsoClauses_IsoClauseId",
                        column: x => x.IsoClauseId,
                        principalTable: "IsoClauses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConformityStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsoClauseId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    LastAudit = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NextAudit = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Comments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConformityStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConformityStatuses_IsoClauses_IsoClauseId",
                        column: x => x.IsoClauseId,
                        principalTable: "IsoClauses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Phases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CycleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Phases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Phases_PdcaCycles_CycleId",
                        column: x => x.CycleId,
                        principalTable: "PdcaCycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    FichierNom = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: true),
                    FichierType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FichierData = table.Column<byte[]>(type: "varbinary(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Processus_ProcessusId",
                        column: x => x.ProcessusId,
                        principalTable: "Processus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActionsCorrectives",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NonConformiteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Responsible = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Deadline = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionsCorrectives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActionsCorrectives_NonConformites_NonConformiteId",
                        column: x => x.NonConformiteId,
                        principalTable: "NonConformites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NomComplet = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUsers_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PlanSteps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActionPlanId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "todo"),
                    Echeance = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanSteps_ActionPlans_ActionPlanId",
                        column: x => x.ActionPlanId,
                        principalTable: "ActionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FileAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ConformityProofId = table.Column<int>(type: "int", nullable: true),
                    ActionPlanId = table.Column<int>(type: "int", nullable: true),
                    OriginalName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Content = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FileAttachments_ActionPlans_ActionPlanId",
                        column: x => x.ActionPlanId,
                        principalTable: "ActionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FileAttachments_ConformityProofs_ConformityProofId",
                        column: x => x.ConformityProofId,
                        principalTable: "ConformityProofs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Sections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PhaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sections_Phases_PhaseId",
                        column: x => x.PhaseId,
                        principalTable: "Phases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentationDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Version = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Classification = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Approver = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Clause = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Controle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OriginalFileName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    LastModifiedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    ApprovedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentationDocuments_AspNetUsers_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DocumentationDocuments_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DocumentationDocuments_AspNetUsers_LastModifiedByUserId",
                        column: x => x.LastModifiedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DocumentationDocuments_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RiskStudies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Organization = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Perimeter = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Author = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    LastModifiedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskStudies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskStudies_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RiskStudies_AspNetUsers_LastModifiedByUserId",
                        column: x => x.LastModifiedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RiskStudies_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PdcaItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PdcaItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PdcaItems_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActionPlans_IsoClauseId",
                table: "ActionPlans",
                column: "IsoClauseId");

            migrationBuilder.CreateIndex(
                name: "IX_ActionPlans_SubClauseId",
                table: "ActionPlans",
                column: "SubClauseId");

            migrationBuilder.CreateIndex(
                name: "IX_ActionsCorrectives_NonConformiteId",
                table: "ActionsCorrectives",
                column: "NonConformiteId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_SocieteId",
                table: "AspNetUsers",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AuditControlStatuses_AuditId",
                table: "AuditControlStatuses",
                column: "AuditId");

            migrationBuilder.CreateIndex(
                name: "IX_ConformityProofs_IsoClauseId_UserId",
                table: "ConformityProofs",
                columns: new[] { "IsoClauseId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ConformityStatuses_IsoClauseId",
                table: "ConformityStatuses",
                column: "IsoClauseId");

            migrationBuilder.CreateIndex(
                name: "IX_ControleHistoriques_ControleId",
                table: "ControleHistoriques",
                column: "ControleId");

            migrationBuilder.CreateIndex(
                name: "IX_controles_Code",
                table: "controles",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_ApprovedByUserId",
                table: "DocumentationDocuments",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_CreatedByUserId",
                table: "DocumentationDocuments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_LastModifiedByUserId",
                table: "DocumentationDocuments",
                column: "LastModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_SocieteId_Category",
                table: "DocumentationDocuments",
                columns: new[] { "SocieteId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_SocieteId_Status",
                table: "DocumentationDocuments",
                columns: new[] { "SocieteId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_UpdatedAt",
                table: "DocumentationDocuments",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ProcessusId",
                table: "Documents",
                column: "ProcessusId");

            migrationBuilder.CreateIndex(
                name: "IX_FileAttachments_ActionPlanId",
                table: "FileAttachments",
                column: "ActionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_FileAttachments_ConformityProofId",
                table: "FileAttachments",
                column: "ConformityProofId");

            migrationBuilder.CreateIndex(
                name: "IX_FileAttachments_UserId",
                table: "FileAttachments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationDocuments_FormationId",
                table: "FormationDocuments",
                column: "FormationId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationNotifications_FormationId",
                table: "FormationNotifications",
                column: "FormationId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationParticipants_FormationId",
                table: "FormationParticipants",
                column: "FormationId");

            migrationBuilder.CreateIndex(
                name: "IX_IsoClauses_Number",
                table: "IsoClauses",
                column: "Number");

            migrationBuilder.CreateIndex(
                name: "IX_IsoClauses_ParentId",
                table: "IsoClauses",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformites_AuditId",
                table: "NonConformites",
                column: "AuditId");

            migrationBuilder.CreateIndex(
                name: "IX_PdcaItems_SectionId",
                table: "PdcaItems",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Phases_CycleId",
                table: "Phases",
                column: "CycleId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanSteps_ActionPlanId",
                table: "PlanSteps",
                column: "ActionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanSteps_Echeance",
                table: "PlanSteps",
                column: "Echeance");

            migrationBuilder.CreateIndex(
                name: "IX_PlanSteps_Status",
                table: "PlanSteps",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RiskStudies_CreatedByUserId",
                table: "RiskStudies",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskStudies_LastModifiedByUserId",
                table: "RiskStudies",
                column: "LastModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskStudies_SocieteId",
                table: "RiskStudies",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskStudies_SocieteId_UpdatedAt",
                table: "RiskStudies",
                columns: new[] { "SocieteId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Sections_PhaseId",
                table: "Sections",
                column: "PhaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Societes_HoldingId",
                table: "Societes",
                column: "HoldingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Actifs");

            migrationBuilder.DropTable(
                name: "ActionsCorrectives");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AuditControlStatuses");

            migrationBuilder.DropTable(
                name: "ConformityStatuses");

            migrationBuilder.DropTable(
                name: "ControleHistoriques");

            migrationBuilder.DropTable(
                name: "DocumentationDocuments");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "FileAttachments");

            migrationBuilder.DropTable(
                name: "FormationDocuments");

            migrationBuilder.DropTable(
                name: "FormationNotifications");

            migrationBuilder.DropTable(
                name: "FormationParticipants");

            migrationBuilder.DropTable(
                name: "Incidents");

            migrationBuilder.DropTable(
                name: "PdcaItems");

            migrationBuilder.DropTable(
                name: "PlanSteps");

            migrationBuilder.DropTable(
                name: "Profils");

            migrationBuilder.DropTable(
                name: "RiskStudies");

            migrationBuilder.DropTable(
                name: "SimulationAudits");

            migrationBuilder.DropTable(
                name: "NonConformites");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "controles");

            migrationBuilder.DropTable(
                name: "Processus");

            migrationBuilder.DropTable(
                name: "ConformityProofs");

            migrationBuilder.DropTable(
                name: "Formations");

            migrationBuilder.DropTable(
                name: "Sections");

            migrationBuilder.DropTable(
                name: "ActionPlans");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Audits");

            migrationBuilder.DropTable(
                name: "Phases");

            migrationBuilder.DropTable(
                name: "IsoClauses");

            migrationBuilder.DropTable(
                name: "Societes");

            migrationBuilder.DropTable(
                name: "PdcaCycles");

            migrationBuilder.DropTable(
                name: "Holdings");
        }
    }
}
