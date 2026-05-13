using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class modifcartographie : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProcessusClauses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClauseId = table.Column<int>(type: "int", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Justification = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessusClauses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessusClauses_IsoClauses_ClauseId",
                        column: x => x.ClauseId,
                        principalTable: "IsoClauses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessusClauses_Processus_ProcessusId",
                        column: x => x.ProcessusId,
                        principalTable: "Processus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessusClauses_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProcessusControles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ControleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Justification = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessusControles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessusControles_Processus_ProcessusId",
                        column: x => x.ProcessusId,
                        principalTable: "Processus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessusControles_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProcessusControles_controles_ControleId",
                        column: x => x.ControleId,
                        principalTable: "controles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusClauses_ClauseId",
                table: "ProcessusClauses",
                column: "ClauseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusClauses_ProcessusId",
                table: "ProcessusClauses",
                column: "ProcessusId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusClauses_ProcessusId_ClauseId",
                table: "ProcessusClauses",
                columns: new[] { "ProcessusId", "ClauseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusClauses_SocieteId",
                table: "ProcessusClauses",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusControles_ControleId",
                table: "ProcessusControles",
                column: "ControleId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusControles_ProcessusId",
                table: "ProcessusControles",
                column: "ProcessusId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusControles_ProcessusId_ControleId",
                table: "ProcessusControles",
                columns: new[] { "ProcessusId", "ControleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessusControles_SocieteId",
                table: "ProcessusControles",
                column: "SocieteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessusClauses");

            migrationBuilder.DropTable(
                name: "ProcessusControles");
        }
    }
}
