using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserActivityLogsAndTracabiliteModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserActivityLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    UserFullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UserEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UserRole = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModuleCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ActionCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    HttpMethod = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    Path = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    QueryString = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    TargetType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    TargetId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    StatusCode = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserActivityLogs_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_CreatedAt",
                table: "UserActivityLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_SocieteId",
                table: "UserActivityLogs",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_SocieteId_ActionCode",
                table: "UserActivityLogs",
                columns: new[] { "SocieteId", "ActionCode" });

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_SocieteId_CreatedAt",
                table: "UserActivityLogs",
                columns: new[] { "SocieteId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_SocieteId_ModuleCode",
                table: "UserActivityLogs",
                columns: new[] { "SocieteId", "ModuleCode" });

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_UserId",
                table: "UserActivityLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserActivityLogs");
        }
    }
}
