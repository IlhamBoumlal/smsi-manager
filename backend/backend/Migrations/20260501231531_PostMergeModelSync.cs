using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class PostMergeModelSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.FileAttachments', 'DocumentationDocumentId') IS NULL
BEGIN
    ALTER TABLE [dbo].[FileAttachments] ADD [DocumentationDocumentId] uniqueidentifier NULL;
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.DocumentationDocuments', 'FileHash') IS NULL
BEGIN
    ALTER TABLE [dbo].[DocumentationDocuments] ADD [FileHash] nvarchar(450) NULL;
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_FileAttachments_DocumentationDocumentId'
      AND object_id = OBJECT_ID('dbo.FileAttachments')
)
BEGIN
    CREATE INDEX [IX_FileAttachments_DocumentationDocumentId]
        ON [dbo].[FileAttachments]([DocumentationDocumentId]);
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_DocumentationDocuments_SocieteId_FileHash'
      AND object_id = OBJECT_ID('dbo.DocumentationDocuments')
)
BEGIN
    CREATE INDEX [IX_DocumentationDocuments_SocieteId_FileHash]
        ON [dbo].[DocumentationDocuments]([SocieteId], [FileHash]);
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_FileAttachments_DocumentationDocuments_DocumentationDocumentId'
)
BEGIN
    ALTER TABLE [dbo].[FileAttachments] WITH CHECK
    ADD CONSTRAINT [FK_FileAttachments_DocumentationDocuments_DocumentationDocumentId]
    FOREIGN KEY([DocumentationDocumentId]) REFERENCES [dbo].[DocumentationDocuments] ([Id])
    ON DELETE SET NULL;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_FileAttachments_DocumentationDocuments_DocumentationDocumentId'
)
BEGIN
    ALTER TABLE [dbo].[FileAttachments]
    DROP CONSTRAINT [FK_FileAttachments_DocumentationDocuments_DocumentationDocumentId];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_FileAttachments_DocumentationDocumentId'
      AND object_id = OBJECT_ID('dbo.FileAttachments')
)
BEGIN
    DROP INDEX [IX_FileAttachments_DocumentationDocumentId] ON [dbo].[FileAttachments];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_DocumentationDocuments_SocieteId_FileHash'
      AND object_id = OBJECT_ID('dbo.DocumentationDocuments')
)
BEGIN
    DROP INDEX [IX_DocumentationDocuments_SocieteId_FileHash] ON [dbo].[DocumentationDocuments];
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.FileAttachments', 'DocumentationDocumentId') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[FileAttachments] DROP COLUMN [DocumentationDocumentId];
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.DocumentationDocuments', 'FileHash') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[DocumentationDocuments] DROP COLUMN [FileHash];
END
");
        }
    }
}
