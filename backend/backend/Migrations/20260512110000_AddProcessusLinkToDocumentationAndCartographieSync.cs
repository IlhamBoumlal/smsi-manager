using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260512110000_AddProcessusLinkToDocumentationAndCartographieSync")]
    public partial class AddProcessusLinkToDocumentationAndCartographieSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Processus",
                table: "DocumentationDocuments",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentationDocuments_SocieteId_Processus",
                table: "DocumentationDocuments",
                columns: new[] { "SocieteId", "Processus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DocumentationDocuments_SocieteId_Processus",
                table: "DocumentationDocuments");

            migrationBuilder.DropColumn(
                name: "Processus",
                table: "DocumentationDocuments");
        }
    }
}
