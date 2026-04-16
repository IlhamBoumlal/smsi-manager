using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitMigration : Migration
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
                name: "controles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Titre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Domaine = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Applicable = table.Column<bool>(type: "bit", nullable: false),
                    JustificationApplicabilite = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Preuves = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Responsable = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReferenceDocument = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateMiseAJour = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_controles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_controles_Societes_SocieteId",
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

            migrationBuilder.InsertData(
                table: "controles",
                columns: new[] { "Id", "Applicable", "Code", "DateMiseAJour", "Description", "Domaine", "JustificationApplicabilite", "Preuves", "ReferenceDocument", "Responsable", "SocieteId", "Statut", "Titre" },
                values: new object[,]
                {
                    { new Guid("0402916e-8b5f-ade0-1f5e-ce0b975a2002"), true, "A.5.35", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'approche de l'organisation pour la gestion de la sécurité de l'information et sa mise en œuvre doivent être examinées indépendamment à des intervalles planifiés ou lors de changements significatifs.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Examens indépendants de la sécurité de l'information" },
                    { new Guid("05b3bc01-6902-27e6-8200-d56c76e0efe1"), true, "A.8.16", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les réseaux, systèmes et applications doivent être surveillés pour détecter les comportements anormaux et prendre les mesures appropriées.", "Technologique", "", "", "", "", null, "NonEvalue", "Surveillance des activités" },
                    { new Guid("07a1ff55-6c67-9f2c-068f-d2ba54d51a5d"), true, "A.6.7", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des mesures de sécurité doivent être mises en œuvre lorsque les employés travaillent à distance pour protéger les informations accessibles, traitées ou stockées à distance.", "Personnes", "", "", "", "", null, "NonEvalue", "Travail à distance" },
                    { new Guid("0eabd242-9428-dec1-d605-11b64f7c5f26"), true, "A.7.10", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les supports de stockage doivent être gérés tout au long de leur cycle de vie d'acquisition, d'utilisation, de transport et d'élimination conformément aux exigences de sécurité de l'information.", "Physique", "", "", "", "", null, "NonEvalue", "Supports de stockage" },
                    { new Guid("0febfa0f-8d38-3a5a-3205-4d861b27dc10"), true, "A.6.3", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les employés et les parties externes doivent recevoir une sensibilisation, une éducation et une formation appropriées à la sécurité de l'information, et des mises à jour régulières des politiques et procédures de l'organisation.", "Personnes", "", "", "", "", null, "NonEvalue", "Sensibilisation, éducation et formation à la sécurité de l'information" },
                    { new Guid("0ff4f640-5b7b-0020-6294-11dc13ae9237"), true, "A.5.21", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des processus doivent être définis et mis en œuvre pour gérer la sécurité de l'information dans la chaîne d'approvisionnement des produits et services TIC.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Gestion de la sécurité de l'information dans la chaîne d'approvisionnement TIC" },
                    { new Guid("12571bad-f5ad-ece5-a0ae-34bedc41a527"), true, "A.5.27", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les connaissances acquises lors de l'analyse et de la résolution des incidents de sécurité de l'information doivent être utilisées pour réduire la probabilité ou l'impact des incidents futurs.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Apprentissage des incidents de sécurité de l'information" },
                    { new Guid("12735a2c-eee8-17ae-7728-a22f3d8f33d4"), true, "A.6.6", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des accords de confidentialité ou de non-divulgation reflétant les besoins de l'organisation en matière de protection des informations doivent être identifiés, documentés, régulièrement examinés et signés par les employés et les parties externes.", "Personnes", "", "", "", "", null, "NonEvalue", "Accords de confidentialité ou de non-divulgation" },
                    { new Guid("135fa2d6-bb00-badd-89aa-32fefe788b4b"), true, "A.7.4", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les locaux doivent être surveillés en continu pour détecter les accès physiques non autorisés.", "Physique", "", "", "", "", null, "NonEvalue", "Surveillance de la sécurité physique" },
                    { new Guid("1702c0e6-50fd-9021-9edf-ff89dfd2d741"), true, "A.8.32", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les changements apportés aux processus, aux systèmes d'information ou aux applications doivent être contrôlés à l'aide d'un processus formel de gestion des changements.", "Technologique", "", "", "", "", null, "NonEvalue", "Gestion des changements" },
                    { new Guid("19dcb226-fd7f-5fdf-668d-8ff5604c45ea"), true, "A.8.11", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Le masquage des données doit être utilisé conformément aux règles spécifiques de l'organisation concernant l'accès et la réglementation applicable.", "Technologique", "", "", "", "", null, "NonEvalue", "Masquage des données" },
                    { new Guid("2130c885-110c-f7cc-515c-64b98202fde8"), true, "A.5.28", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit établir et mettre en œuvre des procédures pour l'identification, la collecte, l'acquisition et la préservation des preuves liées aux incidents de sécurité de l'information.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Collecte de preuves" },
                    { new Guid("217923d6-2e46-f7b0-a741-8ef29029e207"), true, "A.7.2", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les zones sécurisées doivent être protégées par des contrôles d'entrée appropriés pour s'assurer que seul le personnel autorisé est autorisé à accéder.", "Physique", "", "", "", "", null, "NonEvalue", "Contrôle d'entrée physique" },
                    { new Guid("224017d9-81f6-f914-c8d5-beeeec2763bc"), true, "A.7.6", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des mesures de sécurité pour travailler dans des zones sécurisées doivent être conçues et appliquées.", "Physique", "", "", "", "", null, "NonEvalue", "Travail dans des zones sécurisées" },
                    { new Guid("2c2cbf2f-5aa9-bd33-da60-3871c3fb7ea1"), true, "A.5.4", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "La direction doit exiger de tous les employés et parties externes qu'ils appliquent la sécurité de l'information conformément aux politiques établies.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Responsabilités de la direction" },
                    { new Guid("2fe003f0-4798-5116-8bf9-3300cd8c194f"), true, "A.8.23", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'accès aux sites Web externes doit être géré pour réduire l'exposition aux contenus malveillants.", "Technologique", "", "", "", "", null, "NonEvalue", "Filtrage Web" },
                    { new Guid("3624ab4a-0d5a-7e86-ade3-20b49458dd55"), true, "A.5.18", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les droits d'accès aux informations et autres actifs associés doivent être provisionnés, révisés, modifiés et supprimés conformément au sujet spécifique de l'organisation.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Droits d'accès" },
                    { new Guid("3a7d9d39-017c-0a05-33ce-b1335fd5f34f"), true, "A.8.18", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'utilisation des programmes utilitaires qui peuvent être capables de contourner les contrôles du système et d'application doit être restreinte et étroitement contrôlée.", "Technologique", "", "", "", "", null, "NonEvalue", "Utilisation des programmes utilitaires privilégiés" },
                    { new Guid("3d8b00a5-a72b-612b-a566-c5aed6fe5676"), true, "A.8.24", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des règles pour l'utilisation efficace de la cryptographie, y compris la gestion des clés cryptographiques, doivent être définies et mises en œuvre.", "Technologique", "", "", "", "", null, "NonEvalue", "Utilisation de la cryptographie" },
                    { new Guid("40c3abb4-67ba-8111-e50d-c97c0aa0ec29"), true, "A.7.5", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Une protection contre les menaces physiques et environnementales, telles que les catastrophes naturelles et les attaques malveillantes, doit être conçue et appliquée.", "Physique", "", "", "", "", null, "NonEvalue", "Protection contre les menaces physiques et environnementales" },
                    { new Guid("42e6782f-4835-b679-4890-5cd05aa62282"), true, "A.8.15", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des journaux d'enregistrement des activités, des exceptions, des erreurs et autres événements pertinents doivent être produits, conservés et examinés régulièrement.", "Technologique", "", "", "", "", null, "NonEvalue", "Journalisation" },
                    { new Guid("43369ebd-83e6-93be-ebbf-03e622d2223b"), true, "A.5.3", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les tâches et les domaines de responsabilité conflictuels doivent être séparés pour réduire les risques de modification non autorisée ou non intentionnelle des actifs de l'organisation.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Séparation des tâches" },
                    { new Guid("43b642a6-5c3f-5b66-22bc-ae7f489c237e"), true, "A.5.10", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des règles d'utilisation acceptable et des procédures pour le traitement des informations et autres actifs associés doivent être identifiées, documentées et mises en œuvre.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Utilisation acceptable des informations et autres actifs associés" },
                    { new Guid("474d7ea1-82b5-3e4a-f921-4170f3f537c0"), true, "A.8.1", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les informations stockées, traitées ou accessibles via les dispositifs terminaux des utilisateurs doivent être protégées.", "Technologique", "", "", "", "", null, "NonEvalue", "Dispositifs terminaux des utilisateurs" },
                    { new Guid("47590f4c-758d-e1db-199b-1e49b257f82d"), true, "A.5.25", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit évaluer les événements de sécurité de l'information et décider s'ils doivent être classés comme incidents de sécurité de l'information.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Évaluation et décision relatives aux événements de sécurité de l'information" },
                    { new Guid("4e1d7b79-a559-77b1-5ce2-b5df2060c610"), true, "A.5.22", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit régulièrement surveiller, examiner, auditer et gérer les changements dans les services des fournisseurs.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Suivi, examen et gestion du changement des services fournisseurs" },
                    { new Guid("4ed45b2c-86fd-7f1b-a304-dd324f57afa0"), true, "A.6.4", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Un processus disciplinaire doit être en place pour traiter les cas de violation de la sécurité de l'information par les employés et les parties externes.", "Personnes", "", "", "", "", null, "NonEvalue", "Processus disciplinaire" },
                    { new Guid("505f56c9-031a-8671-fc3a-e0274418b526"), true, "A.5.6", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit maintenir des contacts appropriés avec des groupes d'intérêt spéciaux ou d'autres forums professionnels spécialisés en sécurité.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Contact avec des groupes d'intérêt spéciaux" },
                    { new Guid("508f6a6b-4290-8a76-7f84-1459fae5525e"), true, "A.5.30", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "La préparation des technologies de l'information doit être planifiée, mise en œuvre, maintenue et testée sur la base d'objectifs de continuité des activités et d'exigences de sécurité de l'information.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Préparation des technologies de l'information pour la continuité des activités" },
                    { new Guid("54ebfe63-6446-4a4a-0120-867b1b92230e"), true, "A.5.24", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit planifier et préparer la gestion des incidents de sécurité de l'information en définissant, établissant et communiquant les processus et responsabilités pour la gestion des incidents.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Planification de la gestion des incidents de sécurité de l'information" },
                    { new Guid("550b5a60-8501-7e48-feb1-4e4f2bf1e9d1"), true, "A.5.9", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Un inventaire des informations et autres actifs associés, y compris les propriétaires, doit être établi et maintenu.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Inventaire des informations et autres actifs associés" },
                    { new Guid("587f8d66-26b3-340f-51c3-98c7861fbe73"), true, "A.5.32", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit mettre en œuvre des procédures appropriées pour protéger les droits de propriété intellectuelle.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Droits de propriété intellectuelle" },
                    { new Guid("5c38b072-8b20-65cd-6fc2-8dd150f61520"), true, "A.7.3", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Une sécurité physique doit être appliquée aux bureaux, salles et installations.", "Physique", "", "", "", "", null, "NonEvalue", "Sécurisation des bureaux, salles et installations" },
                    { new Guid("5f9f54e4-7cf0-cda6-e137-4ea3fb0448eb"), true, "A.8.13", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des copies de sauvegarde des informations, des logiciels et des images système doivent être effectuées et testées régulièrement conformément à une politique de sauvegarde convenue.", "Technologique", "", "", "", "", null, "NonEvalue", "Sauvegarde des informations" },
                    { new Guid("63e76403-6c40-a83e-682c-8a9e109b3b93"), true, "A.8.3", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'accès aux informations et autres actifs associés doit être restreint conformément aux règles de contrôle d'accès établies.", "Technologique", "", "", "", "", null, "NonEvalue", "Restriction d'accès aux informations" },
                    { new Guid("69a49c39-9e48-e314-3a70-cd9452ebdcab"), true, "A.8.6", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'utilisation des ressources doit être surveillée et ajustée en fonction des exigences de capacité actuelles et prévues.", "Technologique", "", "", "", "", null, "NonEvalue", "Gestion des capacités" },
                    { new Guid("69e906ac-f932-44d1-04ad-09f09e961c1d"), true, "A.5.29", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit planifier la façon de maintenir la sécurité de l'information à un niveau approprié en cas de perturbation.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Sécurité de l'information en cas de perturbation" },
                    { new Guid("6bf9eb59-1559-9b84-ee0f-ed6ab136ed4b"), true, "A.5.17", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des processus de gestion des informations d'authentification doivent être mis en œuvre et soutenus par un processus d'attribution des informations d'authentification aux sujets.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Informations d'authentification" },
                    { new Guid("6c97bc6a-d6f3-2a8c-640e-43ea1ed640ae"), true, "A.8.27", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les principes d'architecture de système sécurisée et d'ingénierie doivent être établis, documentés, maintenus et appliqués à toute activité de développement de système d'information.", "Technologique", "", "", "", "", null, "NonEvalue", "Architecture de système sécurisée et principes d'ingénierie" },
                    { new Guid("722ffceb-7c40-32b5-9ce7-944d29a755dd"), true, "A.7.12", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Le câblage transportant l'alimentation, les données ou les services d'assistance doit être protégé contre l'interception, les interférences ou les dommages.", "Physique", "", "", "", "", null, "NonEvalue", "Sécurité du câblage" },
                    { new Guid("738ede04-f2e1-2a71-adf0-5b31d299b505"), true, "A.6.5", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les responsabilités et devoirs en matière de sécurité de l'information qui restent valables après la cessation ou le changement d'emploi doivent être définis, communiqués et appliqués.", "Personnes", "", "", "", "", null, "NonEvalue", "Responsabilités après la cessation ou le changement d'emploi" },
                    { new Guid("7685bef7-b7d2-1e91-b62e-bc98fd3c706e"), true, "A.5.34", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit identifier et respecter les exigences relatives à la vie privée et à la protection des données à caractère personnel conformément aux lois, règlements et exigences contractuelles applicables.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Vie privée et protection des données à caractère personnel" },
                    { new Guid("79021cc8-1fad-7780-27e0-2f2e7eafc24a"), true, "A.7.13", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les équipements doivent être maintenus correctement pour assurer leur disponibilité, leur intégrité et leur confidentialité continues.", "Physique", "", "", "", "", null, "NonEvalue", "Maintenance des équipements" },
                    { new Guid("7a60e202-7c2b-7364-bff8-ca88a984ae9e"), true, "A.6.2", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les accords contractuels avec les employés et les parties externes doivent énoncer leurs responsabilités et celles de l'organisation en matière de sécurité de l'information.", "Personnes", "", "", "", "", null, "NonEvalue", "Conditions d'emploi" },
                    { new Guid("7a9ef9c3-209f-d3de-7081-d0d22d03aad6"), true, "A.5.7", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des informations sur les menaces liées à la sécurité de l'information doivent être collectées et analysées pour produire un renseignement sur les menaces.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Renseignement sur les menaces" },
                    { new Guid("7c4db865-a8c4-dd4d-c24e-7813292cc5c8"), true, "A.7.9", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les actifs hors site doivent être protégés.", "Physique", "", "", "", "", null, "NonEvalue", "Sécurité des actifs hors site" },
                    { new Guid("7e5e8786-d4e0-1f74-7ab4-19d0f535c754"), true, "A.7.14", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les éléments d'équipement contenant des supports de stockage doivent être vérifiés pour s'assurer que tous les supports de stockage sensibles et les logiciels sous licence ont été retirés ou écrasés de manière sécurisée avant l'élimination ou la réutilisation.", "Physique", "", "", "", "", null, "NonEvalue", "Élimination ou réutilisation sécurisée des équipements" },
                    { new Guid("83cdc3f7-7d67-c30a-757b-ca0b97f642fc"), true, "A.5.36", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "La conformité aux politiques et règles de sécurité de l'information doit être examinée régulièrement.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Conformité aux politiques et règles de sécurité de l'information" },
                    { new Guid("87210a53-6ae8-b5d3-4b56-921ec9bc3898"), true, "A.5.8", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "La sécurité de l'information doit être intégrée dans la gestion de projet.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Sécurité de l'information dans la gestion de projet" },
                    { new Guid("873a3b26-7e64-176c-bad7-b5151df38713"), true, "A.8.20", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les réseaux et les dispositifs réseau doivent être sécurisés, gérés et contrôlés pour protéger les informations dans les systèmes et applications.", "Technologique", "", "", "", "", null, "NonEvalue", "Sécurité des réseaux" },
                    { new Guid("87c8b295-861d-e83d-ac1b-8acb38d6234d"), true, "A.8.30", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit diriger, surveiller et examiner les activités de développement de systèmes externalisées.", "Technologique", "", "", "", "", null, "NonEvalue", "Développement externalisé" },
                    { new Guid("88c24709-c8f9-00df-3035-3a3410a34eec"), true, "A.5.11", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les employés et les parties externes doivent restituer tous les actifs de l'organisation en leur possession lors de la cessation de leur emploi, de leur contrat ou de leur accord.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Retour des actifs" },
                    { new Guid("8abf96fd-7192-aca5-0b4f-54549856bf6e"), true, "A.6.1", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des vérifications des antécédents de tous les candidats aux fonctions doivent être effectuées avant de rejoindre l'organisation et de manière continue en tenant compte des lois, règlements et éthique applicables.", "Personnes", "", "", "", "", null, "NonEvalue", "Vérification des antécédents" },
                    { new Guid("8d565697-38db-3735-9469-e2d1cc8928ab"), true, "A.8.2", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'attribution et l'utilisation des droits d'accès privilégiés doivent être restreintes et gérées.", "Technologique", "", "", "", "", null, "NonEvalue", "Droits d'accès privilégiés" },
                    { new Guid("8e3624e2-7a5b-1bc5-199e-3278c0592b54"), true, "A.5.33", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les enregistrements doivent être protégés contre la perte, la destruction, la falsification, l'accès non autorisé et la publication non autorisée.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Protection des enregistrements" },
                    { new Guid("8e80edb2-5a68-9122-d3a7-fa719b300385"), true, "A.5.31", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les exigences légales, statutaires, réglementaires et contractuelles pertinentes pour la sécurité de l'information et l'approche de l'organisation pour y répondre doivent être identifiées, documentées et tenues à jour.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Exigences légales, statutaires, réglementaires et contractuelles" },
                    { new Guid("9004f195-c06b-90e1-9fb9-902b5a2b166b"), true, "A.8.21", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des mécanismes de sécurité, des niveaux de service et des exigences de gestion doivent être identifiés pour tous les services réseau, et inclus dans les accords de services réseau, que ces services soient fournis en interne ou externalisés.", "Technologique", "", "", "", "", null, "NonEvalue", "Sécurité des services réseau" },
                    { new Guid("9222b057-2837-8314-ca13-c1bdafdbbb12"), true, "A.5.23", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des processus d'acquisition, d'utilisation, de gestion et de sortie des services en nuage doivent être établis conformément aux exigences de sécurité de l'information de l'organisation.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Sécurité de l'information pour l'utilisation des services en nuage" },
                    { new Guid("93d033e7-5e09-0f69-af47-9aec5ff13fd6"), true, "A.8.5", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des technologies et procédures d'authentification sécurisée doivent être mises en œuvre sur la base des restrictions de contrôle d'accès et des règles de gestion des informations d'authentification.", "Technologique", "", "", "", "", null, "NonEvalue", "Authentification sécurisée" },
                    { new Guid("9464fa04-2df0-daa6-959c-7e95caa034a9"), true, "A.8.17", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les horloges des systèmes de traitement de l'information utilisés par l'organisation doivent être synchronisées avec des sources horaires approuvées.", "Technologique", "", "", "", "", null, "NonEvalue", "Synchronisation des horloges" },
                    { new Guid("954cf6d2-80fb-d790-a892-d0a3d6f4fe2f"), true, "A.5.2", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les rôles et responsabilités en matière de sécurité de l'information doivent être définis et attribués conformément aux besoins de l'organisation.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Rôles et responsabilités en matière de sécurité de l'information" },
                    { new Guid("97ef4663-0018-4b1c-0c25-01750f06e553"), true, "A.5.14", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des règles, procédures ou accords de transfert d'informations doivent être en place pour tous les types de moyens de transfert au sein de l'organisation et entre l'organisation et d'autres parties.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Transfert d'informations" },
                    { new Guid("98a6d3c6-ac6e-c818-1a52-7d19aa6a084c"), true, "A.8.7", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Une protection contre les logiciels malveillants doit être mise en œuvre et soutenue par une sensibilisation appropriée des utilisateurs.", "Technologique", "", "", "", "", null, "NonEvalue", "Protection contre les logiciels malveillants" },
                    { new Guid("9945468f-4296-795d-8d2b-ec979dc5b085"), true, "A.5.15", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des règles de contrôle d'accès, des droits et des restrictions pour les utilisateurs et les sujets doivent être établis conformément aux exigences de sécurité de l'information.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Contrôle d'accès" },
                    { new Guid("a53ca54d-ffec-d039-97b0-5fcd58722c48"), true, "A.8.22", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les groupes de services d'information, les utilisateurs et les systèmes d'information doivent être séparés sur les réseaux.", "Technologique", "", "", "", "", null, "NonEvalue", "Séparation des réseaux" },
                    { new Guid("ab123c86-fc50-dda9-c7d8-3c42dfc8b2f1"), true, "A.8.14", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les installations de traitement de l'information doivent être mises en œuvre avec une redondance suffisante pour répondre aux exigences de disponibilité.", "Technologique", "", "", "", "", null, "NonEvalue", "Redondance des installations de traitement de l'information" },
                    { new Guid("ad0c7819-557b-05ce-3fcb-e193db925a56"), true, "A.8.31", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les environnements de développement, de test et de production doivent être séparés et sécurisés.", "Technologique", "", "", "", "", null, "NonEvalue", "Séparation des environnements de développement, de test et de production" },
                    { new Guid("ada7c3ff-eb8f-3026-e2cf-36b7d2dba967"), true, "A.8.8", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des informations sur les vulnérabilités techniques des systèmes d'information utilisés doivent être obtenues, l'exposition de l'organisation à ces vulnérabilités doit être évaluée et des mesures appropriées doivent être prises.", "Technologique", "", "", "", "", null, "NonEvalue", "Gestion des vulnérabilités techniques" },
                    { new Guid("af6c8b53-0afa-60b9-f578-4b8e4db37a63"), true, "A.5.13", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des procédures appropriées d'étiquetage de l'information doivent être développées et mises en œuvre conformément au système de classification adopté par l'organisation.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Étiquetage de l'information" },
                    { new Guid("afe05493-f528-316a-7f8c-b0480a3a333a"), true, "A.5.37", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les procédures opérationnelles documentées doivent être tenues à jour et mises à la disposition de tous les utilisateurs qui en ont besoin.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Procédures opérationnelles documentées" },
                    { new Guid("b67b906b-4d0a-708c-fce0-4c1c1f1bc45c"), true, "A.7.7", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des règles de bureau propre pour les documents papier et les supports de stockage amovibles et des règles d'écran clair pour les installations de traitement de l'information doivent être définies et appliquées.", "Physique", "", "", "", "", null, "NonEvalue", "Bureau propre et écran clair" },
                    { new Guid("b785f82e-dc23-267b-167d-71ec01df4920"), true, "A.5.19", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des processus et procédures doivent être définis et mis en œuvre pour gérer la sécurité de l'information dans les relations avec les fournisseurs.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Sécurité de l'information dans les relations avec les fournisseurs" },
                    { new Guid("b89752db-f22b-94c2-ab2b-caf3aff48a23"), true, "A.5.20", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les exigences pertinentes en matière de sécurité de l'information pour atténuer les risques associés à l'accès des fournisseurs aux actifs de l'organisation doivent être établies et convenues avec chaque fournisseur.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Traitement de la sécurité de l'information dans les accords avec les fournisseurs" },
                    { new Guid("b9ef989b-0006-336a-8f7d-8bd701c4cf05"), true, "A.5.12", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les informations doivent être classifiées selon les besoins de protection de l'organisation en cas de divulgation, de modification, de suppression ou de destruction.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Classification de l'information" },
                    { new Guid("bb5807a6-31ae-93cc-c827-083085fc6f7d"), true, "A.8.34", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les tests d'audit et autres activités d'assurance impliquant l'évaluation des systèmes d'information opérationnels doivent être planifiés et convenus entre l'évaluateur et la direction appropriée.", "Technologique", "", "", "", "", null, "NonEvalue", "Protection des systèmes d'information lors des tests d'audit" },
                    { new Guid("bd441850-4fb8-b0ce-8eea-01debebffeb4"), true, "A.8.10", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les informations stockées dans les systèmes d'information, dispositifs ou autres supports de stockage doivent être supprimées lorsqu'elles ne sont plus nécessaires.", "Technologique", "", "", "", "", null, "NonEvalue", "Suppression d'informations" },
                    { new Guid("c09e21be-c459-2e8f-229a-512c81eb1f72"), true, "A.8.26", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les exigences de sécurité de l'information doivent être identifiées, spécifiées et approuvées lors du développement ou de l'acquisition de nouvelles applications ou de l'amélioration d'applications existantes.", "Technologique", "", "", "", "", null, "NonEvalue", "Exigences de sécurité applicatives" },
                    { new Guid("c4367cde-8b3b-1e43-609a-01d9a054ad9b"), true, "A.7.1", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des périmètres de sécurité doivent être définis et utilisés pour protéger les zones contenant des informations et autres actifs associés.", "Physique", "", "", "", "", null, "NonEvalue", "Périmètres de sécurité physique" },
                    { new Guid("c8f67416-f951-33d9-eb12-52fd970c231d"), true, "A.6.8", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit fournir un mécanisme permettant aux employés et aux parties externes de signaler rapidement les événements de sécurité de l'information observés ou suspectés.", "Personnes", "", "", "", "", null, "NonEvalue", "Signalement des événements de sécurité de l'information" },
                    { new Guid("cb2da823-d97d-4358-1901-5f6048530953"), true, "A.5.5", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'organisation doit maintenir des contacts appropriés avec les autorités compétentes.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Contact avec les autorités" },
                    { new Guid("cdeea347-2bc1-e908-38e1-73673c9c3cb5"), true, "A.8.9", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les configurations, y compris les configurations de sécurité, des matériels, logiciels, services et réseaux doivent être établies, documentées, mises en œuvre, surveillées et révisées.", "Technologique", "", "", "", "", null, "NonEvalue", "Gestion de la configuration" },
                    { new Guid("ce0e9b58-2c53-cae5-d443-3e04af011015"), true, "A.8.19", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des procédures et des mesures doivent être mises en œuvre pour gérer en toute sécurité l'installation de logiciels sur des systèmes en exploitation.", "Technologique", "", "", "", "", null, "NonEvalue", "Installation de logiciels sur des systèmes en exploitation" },
                    { new Guid("cff38701-ca7e-4b33-4377-875e4220ff73"), true, "A.5.26", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les incidents de sécurité de l'information doivent être traités conformément aux processus documentés de gestion des incidents.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Réponse aux incidents de sécurité de l'information" },
                    { new Guid("d0e3f79b-197e-adeb-fce5-d2dfa39963f0"), true, "A.7.11", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les équipements doivent être protégés contre les pannes de courant et autres pannes causées par des défaillances des services publics de support.", "Physique", "", "", "", "", null, "NonEvalue", "Utilitaires de support" },
                    { new Guid("d42784a4-da60-c494-7dce-f75c22bc159b"), true, "A.8.25", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des règles pour le développement sécurisé de logiciels et de systèmes doivent être établies et appliquées.", "Technologique", "", "", "", "", null, "NonEvalue", "Cycle de vie de développement sécurisé" },
                    { new Guid("d74463ea-3f8a-b87b-f0f6-62b2bf478a5d"), true, "A.8.33", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les informations sur les tests doivent être sélectionnées, protégées et gérées de manière appropriée.", "Technologique", "", "", "", "", null, "NonEvalue", "Informations sur les tests" },
                    { new Guid("eb300209-b327-f684-1ce3-f1931466d147"), true, "A.8.28", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des principes de codage sécurisé doivent être appliqués au développement de logiciels.", "Technologique", "", "", "", "", null, "NonEvalue", "Codage sécurisé" },
                    { new Guid("ef3abaab-6f5c-7a69-65ae-818dbb93854f"), true, "A.8.4", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "L'accès au code source, aux outils de développement et aux bibliothèques logicielles doit être géré de manière appropriée.", "Technologique", "", "", "", "", null, "NonEvalue", "Accès au code source" },
                    { new Guid("ef46c6c5-938c-faea-5d4a-1f138e6595da"), true, "A.7.8", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les équipements doivent être installés et protégés pour réduire les risques liés aux menaces et dangers environnementaux, ainsi que les risques d'accès non autorisé.", "Physique", "", "", "", "", null, "NonEvalue", "Installation et protection des équipements" },
                    { new Guid("f1fa6316-7ef6-34e8-85f3-b92f8a690c34"), true, "A.5.16", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Le cycle de vie complet des identités doit être géré.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Gestion des identités" },
                    { new Guid("f4fc1c0d-6e3f-e7c4-545f-8dc0472ca073"), true, "A.5.1", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Les politiques de sécurité de l'information doivent être définies, approuvées par la direction, publiées et communiquées aux employés et aux parties externes pertinentes.", "Organisationnel", "", "", "", "", null, "NonEvalue", "Politiques de sécurité de l'information" },
                    { new Guid("f864500a-4b22-32fd-65cd-9e41f30ee59d"), true, "A.8.12", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des mesures de prévention de la fuite de données doivent être appliquées aux systèmes, réseaux et tout autre dispositif qui traite, stocke ou transmet des informations sensibles.", "Technologique", "", "", "", "", null, "NonEvalue", "Prévention de la fuite de données" },
                    { new Guid("f8eec623-6a92-5355-560d-736014f28f2d"), true, "A.8.29", new DateTime(2026, 3, 6, 10, 30, 0, 0, DateTimeKind.Utc), "Des processus de test de sécurité doivent être définis et mis en œuvre dans le cycle de vie du développement.", "Technologique", "", "", "", "", null, "NonEvalue", "Tests de sécurité dans le développement et l'acceptation" }
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
                name: "IX_controles_Code",
                table: "controles",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_controles_SocieteId",
                table: "controles",
                column: "SocieteId");

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
                name: "controles");

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
                name: "PdcaItems");

            migrationBuilder.DropTable(
                name: "PlanSteps");

            migrationBuilder.DropTable(
                name: "RiskStudies");

            migrationBuilder.DropTable(
                name: "SimulationAudits");

            migrationBuilder.DropTable(
                name: "NonConformites");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

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
