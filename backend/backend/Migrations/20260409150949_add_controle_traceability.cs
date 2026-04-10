using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class add_controle_traceability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateMiseAJour",
                table: "controles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DernierModificateurId",
                table: "controles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DernierModificateurNom",
                table: "controles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateMiseAJour",
                table: "controles");

            migrationBuilder.DropColumn(
                name: "DernierModificateurId",
                table: "controles");

            migrationBuilder.DropColumn(
                name: "DernierModificateurNom",
                table: "controles");
        }
    }
}
