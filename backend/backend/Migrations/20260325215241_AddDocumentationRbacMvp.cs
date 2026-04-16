using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentationRbacMvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "DocumentationDocuments",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "DocumentationDocuments",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "DocumentationDocuments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApprovedByUserId",
                table: "DocumentationDocuments",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "DocumentationDocuments",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastModifiedByUserId",
                table: "DocumentationDocuments",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocieteId",
                table: "DocumentationDocuments",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                """
                DECLARE @DefaultSocieteId INT = (SELECT TOP 1 Id FROM Societes ORDER BY Id);
                IF @DefaultSocieteId IS NOT NULL
                BEGIN
                    UPDATE DocumentationDocuments
                    SET SocieteId = @DefaultSocieteId
                    WHERE SocieteId IS NULL;
                END
                """);

            migrationBuilder.Sql(
                """
                UPDATE d
                SET
                    CreatedByUserId = u.Id,
                    LastModifiedByUserId = COALESCE(d.LastModifiedByUserId, u.Id)
                FROM DocumentationDocuments d
                INNER JOIN AspNetUsers u ON u.NomComplet = d.Author
                WHERE d.CreatedByUserId IS NULL
                  AND (d.SocieteId IS NULL OR u.SocieteId = d.SocieteId);
                """);

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

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentationDocuments_AspNetUsers_ApprovedByUserId",
                table: "DocumentationDocuments",
                column: "ApprovedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentationDocuments_AspNetUsers_CreatedByUserId",
                table: "DocumentationDocuments",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentationDocuments_AspNetUsers_LastModifiedByUserId",
                table: "DocumentationDocuments",
                column: "LastModifiedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentationDocuments_Societes_SocieteId",
                table: "DocumentationDocuments",
                column: "SocieteId",
                principalTable: "Societes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentationDocuments_AspNetUsers_ApprovedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentationDocuments_AspNetUsers_CreatedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentationDocuments_AspNetUsers_LastModifiedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentationDocuments_Societes_SocieteId",
                table: "DocumentationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_ApprovedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_CreatedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_LastModifiedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_SocieteId_Category",
                table: "DocumentationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_SocieteId_Status",
                table: "DocumentationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_UpdatedAt",
                table: "DocumentationDocuments");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "DocumentationDocuments");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropColumn(
                name: "LastModifiedByUserId",
                table: "DocumentationDocuments");

            migrationBuilder.DropColumn(
                name: "SocieteId",
                table: "DocumentationDocuments");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "DocumentationDocuments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "DocumentationDocuments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
