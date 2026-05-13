using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class Lot1RbacMultiSociete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Societes_SocieteId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_SocieteId",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "Sections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "PlanSteps",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "Phases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "PdcaItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "FormationParticipants",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "FormationNotifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "FormationDocuments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "ControleHistoriques",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "AuditControlStatuses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryRoleKey",
                table: "AspNetUsers",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "CONSULTANT");

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "ActionsCorrectives",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE u
                SET u.PrimaryRoleKey = 'SUPER_ADMIN'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.NormalizedName = 'SUPER ADMIN';
                """);

            migrationBuilder.Sql(
                """
                UPDATE u
                SET u.PrimaryRoleKey = 'ADMIN_SOCIETE'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.NormalizedName = 'ADMIN SOCIETE';
                """);

            migrationBuilder.Sql(
                """
                UPDATE u
                SET u.PrimaryRoleKey = 'RSSI'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.NormalizedName = 'RSSI';
                """);

            migrationBuilder.Sql(
                """
                UPDATE u
                SET u.PrimaryRoleKey = 'CONSULTANT'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.NormalizedName = 'CONSULTANT';
                """);

            migrationBuilder.Sql(
                """
                UPDATE u
                SET u.PrimaryRoleKey = 'AUDITEUR'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.NormalizedName = 'AUDITEUR';
                """);

            migrationBuilder.Sql(
                """
                UPDATE u
                SET u.PrimaryRoleKey = 'SUPER_ADMIN'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.NormalizedName = 'SUPER ADMIN';
                """);

            migrationBuilder.Sql(
                """
                UPDATE AspNetUsers
                SET PrimaryRoleKey = 'CONSULTANT'
                WHERE PrimaryRoleKey IS NULL OR LTRIM(RTRIM(PrimaryRoleKey)) = '';
                """);

            migrationBuilder.Sql(
                """
                UPDATE AspNetUsers
                SET SocieteId = NULL
                WHERE PrimaryRoleKey = 'SUPER_ADMIN';
                """);

            migrationBuilder.Sql(
                """
                WITH RankedSuperAdmins AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (ORDER BY CreatedAt ASC, Id ASC) AS Rn
                    FROM AspNetUsers
                    WHERE IsActive = 1 AND PrimaryRoleKey = 'SUPER_ADMIN'
                )
                UPDATE u
                SET IsActive = 0
                FROM AspNetUsers u
                INNER JOIN RankedSuperAdmins r ON r.Id = u.Id
                WHERE r.Rn > 1;
                """);

            migrationBuilder.Sql(
                """
                WITH RankedCompanyAdmins AS (
                    SELECT
                        Id,
                        SocieteId,
                        ROW_NUMBER() OVER (PARTITION BY SocieteId ORDER BY CreatedAt ASC, Id ASC) AS Rn
                    FROM AspNetUsers
                    WHERE IsActive = 1
                      AND PrimaryRoleKey = 'ADMIN_SOCIETE'
                      AND SocieteId IS NOT NULL
                )
                UPDATE u
                SET IsActive = 0
                FROM AspNetUsers u
                INNER JOIN RankedCompanyAdmins r ON r.Id = u.Id
                WHERE r.Rn > 1;
                """);

            migrationBuilder.Sql(
                """
                UPDATE AspNetUsers
                SET IsActive = 0
                WHERE PrimaryRoleKey <> 'SUPER_ADMIN'
                  AND SocieteId IS NULL
                  AND IsActive = 1;
                """);

            migrationBuilder.Sql(
                """
                UPDATE ph
                SET ph.SocieteId = c.SocieteId
                FROM Phases ph
                INNER JOIN PdcaCycles c ON c.Id = ph.CycleId
                WHERE ph.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE s
                SET s.SocieteId = ph.SocieteId
                FROM Sections s
                INNER JOIN Phases ph ON ph.Id = s.PhaseId
                WHERE s.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE i
                SET i.SocieteId = s.SocieteId
                FROM PdcaItems i
                INNER JOIN Sections s ON s.Id = i.SectionId
                WHERE i.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE ps
                SET ps.SocieteId = ap.SocieteId
                FROM PlanSteps ps
                INNER JOIN ActionPlans ap ON ap.Id = ps.ActionPlanId
                WHERE ps.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE acs
                SET acs.SocieteId = a.SocieteId
                FROM AuditControlStatuses acs
                INNER JOIN Audits a ON a.Id = acs.AuditId
                WHERE acs.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE ac
                SET ac.SocieteId = nc.SocieteId
                FROM ActionsCorrectives ac
                INNER JOIN NonConformites nc ON nc.Id = ac.NonConformiteId
                WHERE ac.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE h
                SET h.SocieteId = c.SocieteId
                FROM ControleHistoriques h
                INNER JOIN controles c ON c.Id = h.ControleId
                WHERE h.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE fp
                SET fp.SocieteId = f.SocieteId
                FROM FormationParticipants fp
                INNER JOIN Formations f ON f.Id = fp.FormationId
                WHERE fp.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE fd
                SET fd.SocieteId = f.SocieteId
                FROM FormationDocuments fd
                INNER JOIN Formations f ON f.Id = fd.FormationId
                WHERE fd.SocieteId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE fn
                SET fn.SocieteId = f.SocieteId
                FROM FormationNotifications fn
                INNER JOIN Formations f ON f.Id = fn.FormationId
                WHERE fn.SocieteId IS NULL;
                """);

            migrationBuilder.CreateTable(
                name: "CompanyRolePermissionOverrides",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: false),
                    RoleKey = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ModuleId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ActionId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    IsGranted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyRolePermissionOverrides", x => x.Id);
                    table.CheckConstraint("CK_CompanyRolePermissionOverrides_RoleKey", "[RoleKey] IN ('SUPER_ADMIN','ADMIN_SOCIETE','RSSI','CONSULTANT','AUDITEUR')");
                    table.ForeignKey(
                        name: "FK_CompanyRolePermissionOverrides_Actions_ActionId",
                        column: x => x.ActionId,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyRolePermissionOverrides_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyRolePermissionOverrides_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPermissionOverrides",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: false),
                    ModuleId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ActionId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    IsGranted = table.Column<bool>(type: "bit", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPermissionOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPermissionOverrides_Actions_ActionId",
                        column: x => x.ActionId,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPermissionOverrides_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPermissionOverrides_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPermissionOverrides_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Sections_SocieteId",
                table: "Sections",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanSteps_SocieteId",
                table: "PlanSteps",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_Phases_SocieteId",
                table: "Phases",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_PdcaItems_SocieteId",
                table: "PdcaItems",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationParticipants_SocieteId",
                table: "FormationParticipants",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationNotifications_SocieteId",
                table: "FormationNotifications",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationDocuments_SocieteId",
                table: "FormationDocuments",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_ControleHistoriques_SocieteId",
                table: "ControleHistoriques",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditControlStatuses_SocieteId",
                table: "AuditControlStatuses",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PrimaryRoleKey_IsActive",
                table: "AspNetUsers",
                columns: new[] { "PrimaryRoleKey", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "UX_AspNetUsers_SingleActiveAdminPerSociete",
                table: "AspNetUsers",
                column: "SocieteId",
                unique: true,
                filter: "[PrimaryRoleKey] = 'ADMIN_SOCIETE' AND [IsActive] = 1 AND [SocieteId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_AspNetUsers_SingleActiveSuperAdmin",
                table: "AspNetUsers",
                column: "PrimaryRoleKey",
                unique: true,
                filter: "[PrimaryRoleKey] = 'SUPER_ADMIN' AND [IsActive] = 1");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AspNetUsers_PrimaryRoleKey_Allowed_Active",
                table: "AspNetUsers",
                sql: "[IsActive] = 0 OR [PrimaryRoleKey] IN ('SUPER_ADMIN','ADMIN_SOCIETE','RSSI','CONSULTANT','AUDITEUR')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AspNetUsers_SocieteByPrimaryRole_Active",
                table: "AspNetUsers",
                sql: "[IsActive] = 0 OR (([PrimaryRoleKey] = 'SUPER_ADMIN' AND [SocieteId] IS NULL) OR ([PrimaryRoleKey] <> 'SUPER_ADMIN' AND [SocieteId] IS NOT NULL))");

            migrationBuilder.CreateIndex(
                name: "IX_ActionsCorrectives_SocieteId",
                table: "ActionsCorrectives",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyRolePermissionOverrides_ActionId",
                table: "CompanyRolePermissionOverrides",
                column: "ActionId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyRolePermissionOverrides_ModuleId",
                table: "CompanyRolePermissionOverrides",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyRolePermissionOverrides_SocieteId_RoleKey",
                table: "CompanyRolePermissionOverrides",
                columns: new[] { "SocieteId", "RoleKey" });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyRolePermissionOverrides_SocieteId_RoleKey_ModuleId_ActionId",
                table: "CompanyRolePermissionOverrides",
                columns: new[] { "SocieteId", "RoleKey", "ModuleId", "ActionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissionOverrides_ActionId",
                table: "UserPermissionOverrides",
                column: "ActionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissionOverrides_ModuleId",
                table: "UserPermissionOverrides",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissionOverrides_SocieteId_UserId",
                table: "UserPermissionOverrides",
                columns: new[] { "SocieteId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissionOverrides_UserId_ModuleId_ActionId",
                table: "UserPermissionOverrides",
                columns: new[] { "UserId", "ModuleId", "ActionId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ActionsCorrectives_Societes_SocieteId",
                table: "ActionsCorrectives",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Societes_SocieteId",
                table: "AspNetUsers",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditControlStatuses_Societes_SocieteId",
                table: "AuditControlStatuses",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ControleHistoriques_Societes_SocieteId",
                table: "ControleHistoriques",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FormationDocuments_Societes_SocieteId",
                table: "FormationDocuments",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FormationNotifications_Societes_SocieteId",
                table: "FormationNotifications",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FormationParticipants_Societes_SocieteId",
                table: "FormationParticipants",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PdcaItems_Societes_SocieteId",
                table: "PdcaItems",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Phases_Societes_SocieteId",
                table: "Phases",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PlanSteps_Societes_SocieteId",
                table: "PlanSteps",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Sections_Societes_SocieteId",
                table: "Sections",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActionsCorrectives_Societes_SocieteId",
                table: "ActionsCorrectives");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Societes_SocieteId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditControlStatuses_Societes_SocieteId",
                table: "AuditControlStatuses");

            migrationBuilder.DropForeignKey(
                name: "FK_ControleHistoriques_Societes_SocieteId",
                table: "ControleHistoriques");

            migrationBuilder.DropForeignKey(
                name: "FK_FormationDocuments_Societes_SocieteId",
                table: "FormationDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_FormationNotifications_Societes_SocieteId",
                table: "FormationNotifications");

            migrationBuilder.DropForeignKey(
                name: "FK_FormationParticipants_Societes_SocieteId",
                table: "FormationParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_PdcaItems_Societes_SocieteId",
                table: "PdcaItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Phases_Societes_SocieteId",
                table: "Phases");

            migrationBuilder.DropForeignKey(
                name: "FK_PlanSteps_Societes_SocieteId",
                table: "PlanSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_Sections_Societes_SocieteId",
                table: "Sections");

            migrationBuilder.DropTable(
                name: "CompanyRolePermissionOverrides");

            migrationBuilder.DropTable(
                name: "UserPermissionOverrides");

            migrationBuilder.DropIndex(
                name: "IX_Sections_SocieteId",
                table: "Sections");

            migrationBuilder.DropIndex(
                name: "IX_PlanSteps_SocieteId",
                table: "PlanSteps");

            migrationBuilder.DropIndex(
                name: "IX_Phases_SocieteId",
                table: "Phases");

            migrationBuilder.DropIndex(
                name: "IX_PdcaItems_SocieteId",
                table: "PdcaItems");

            migrationBuilder.DropIndex(
                name: "IX_FormationParticipants_SocieteId",
                table: "FormationParticipants");

            migrationBuilder.DropIndex(
                name: "IX_FormationNotifications_SocieteId",
                table: "FormationNotifications");

            migrationBuilder.DropIndex(
                name: "IX_FormationDocuments_SocieteId",
                table: "FormationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_ControleHistoriques_SocieteId",
                table: "ControleHistoriques");

            migrationBuilder.DropIndex(
                name: "IX_AuditControlStatuses_SocieteId",
                table: "AuditControlStatuses");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PrimaryRoleKey_IsActive",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "UX_AspNetUsers_SingleActiveAdminPerSociete",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "UX_AspNetUsers_SingleActiveSuperAdmin",
                table: "AspNetUsers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AspNetUsers_PrimaryRoleKey_Allowed_Active",
                table: "AspNetUsers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AspNetUsers_SocieteByPrimaryRole_Active",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_ActionsCorrectives_SocieteId",
                table: "ActionsCorrectives");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "PlanSteps");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "Phases");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "PdcaItems");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "FormationParticipants");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "FormationNotifications");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "FormationDocuments");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "ControleHistoriques");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "AuditControlStatuses");

            migrationBuilder.DropColumn(
                name: "PrimaryRoleKey",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "ActionsCorrectives");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_SocieteId",
                table: "AspNetUsers",
                column: "SocieteId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Societes_SocieteId",
                table: "AspNetUsers",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id");
        }
    }
}
