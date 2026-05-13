using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddIncidentLifecycleAndDashboardSnapshots : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAt",
                table: "Incidents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Incidents",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Incidents",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.CreateTable(
                name: "DashboardMonthlySnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true),
                    MonthStartUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GlobalConformity = table.Column<int>(type: "int", nullable: false),
                    IncidentsCount = table.Column<int>(type: "int", nullable: false),
                    AuditsCompleted = table.Column<int>(type: "int", nullable: false),
                    PdcaCompleted = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DashboardMonthlySnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DashboardMonthlySnapshots_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DashboardMonthlySnapshots_MonthStartUtc",
                table: "DashboardMonthlySnapshots",
                column: "MonthStartUtc");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardMonthlySnapshots_SocieteId",
                table: "DashboardMonthlySnapshots",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardMonthlySnapshots_SocieteId_MonthStartUtc",
                table: "DashboardMonthlySnapshots",
                columns: new[] { "SocieteId", "MonthStartUtc" },
                unique: true,
                filter: "[SocieteId] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DashboardMonthlySnapshots");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Incidents");
        }
    }
}
