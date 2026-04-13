using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class creationDBLocalClauses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActionPlans_IsoClauses_IsoClauseId",
                table: "ActionPlans");

            migrationBuilder.AddColumn<int>(
                name: "SubClauseId",
                table: "ActionPlans",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActionPlans_SubClauseId",
                table: "ActionPlans",
                column: "SubClauseId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActionPlans_IsoClauses_IsoClauseId",
                table: "ActionPlans",
                column: "IsoClauseId",
                principalTable: "IsoClauses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ActionPlans_IsoClauses_SubClauseId",
                table: "ActionPlans",
                column: "SubClauseId",
                principalTable: "IsoClauses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActionPlans_IsoClauses_IsoClauseId",
                table: "ActionPlans");

            migrationBuilder.DropForeignKey(
                name: "FK_ActionPlans_IsoClauses_SubClauseId",
                table: "ActionPlans");

            migrationBuilder.DropIndex(
                name: "IX_ActionPlans_SubClauseId",
                table: "ActionPlans");

            migrationBuilder.DropColumn(
                name: "SubClauseId",
                table: "ActionPlans");

            migrationBuilder.AddForeignKey(
                name: "FK_ActionPlans_IsoClauses_IsoClauseId",
                table: "ActionPlans",
                column: "IsoClauseId",
                principalTable: "IsoClauses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
