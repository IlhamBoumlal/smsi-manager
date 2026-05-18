using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260518120000_NormalizeDocumentStatuses")]
    public partial class NormalizeDocumentStatuses : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                -- Cartographie: Documents.Statut -> statuts canoniques documentation
                UPDATE [Documents]
                SET [Statut] = 'brouillon'
                WHERE [Statut] IS NULL OR LTRIM(RTRIM([Statut])) = '';

                UPDATE [Documents]
                SET [Statut] = CASE
                    WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('approuve', 'approuver', 'en vigueur', 'envigueur') THEN 'approuve'
                    WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('en-validation', 'en validation') THEN 'en-validation'
                    WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('brouillon', 'en cours', 'encours', 'en cours de redaction') THEN 'brouillon'
                    WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('a-revoir', 'a revoir', 'a reviser', 'obsolete') THEN 'a-revoir'
                    ELSE [Statut]
                END
                WHERE [Statut] IS NOT NULL;

                -- Documentation: normalisation defensive de Status
                UPDATE [DocumentationDocuments]
                SET [Status] = 'brouillon'
                WHERE [Status] IS NULL OR LTRIM(RTRIM([Status])) = '';

                UPDATE [DocumentationDocuments]
                SET [Status] = CASE
                    WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('approuve', 'approuver') THEN 'approuve'
                    WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('en-validation', 'en validation') THEN 'en-validation'
                    WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('brouillon') THEN 'brouillon'
                    WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('a-revoir', 'a revoir', 'a reviser') THEN 'a-revoir'
                    ELSE [Status]
                END
                WHERE [Status] IS NOT NULL;
                """
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                -- Revert vers les libelles historiques cartographie (best effort)
                UPDATE [Documents]
                SET [Statut] = CASE
                    WHEN [Statut] = 'approuve' THEN 'en vigueur'
                    WHEN [Statut] = 'en-validation' THEN 'en cours'
                    WHEN [Statut] = 'a-revoir' THEN 'a reviser'
                    ELSE [Statut]
                END
                WHERE [Statut] IS NOT NULL;

                -- Revert best effort documentation
                UPDATE [DocumentationDocuments]
                SET [Status] = CASE
                    WHEN [Status] = 'en-validation' THEN 'en validation'
                    WHEN [Status] = 'a-revoir' THEN 'a reviser'
                    ELSE [Status]
                END
                WHERE [Status] IS NOT NULL;
                """
            );
        }
    }
}
