using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddControleHistorique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateIndex(
                name: "IX_ControleHistoriques_ControleId",
                table: "ControleHistoriques",
                column: "ControleId");

            migrationBuilder.CreateIndex(
                name: "IX_ControleHistoriques_DateModification",
                table: "ControleHistoriques",
                column: "DateModification");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ControleHistoriques");
        }
    }
}
