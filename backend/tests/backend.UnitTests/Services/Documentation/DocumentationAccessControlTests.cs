using backend.Application.Documentation;
using backend.Domain.Entities;
using FluentAssertions;

namespace backend.UnitTests.Services.Documentation;

public class DocumentationAccessControlTests
{
    [Fact]
    public void BuildModulePermissions_ShouldBeReadOnly_ForAdminSociete()
    {
        var actor = DocumentationAccessControl.BuildActorContext(
            userId: "u-admin",
            societeId: 1,
            roles: [ "Admin Societe" ]);

        var permissions = DocumentationAccessControl.BuildModulePermissions(actor);

        permissions.CanConsult.Should().BeTrue();
        permissions.CanCreate.Should().BeFalse();
        permissions.CanEditAny.Should().BeFalse();
        permissions.CanDelete.Should().BeFalse();
        permissions.CanApprove.Should().BeFalse();
    }

    [Fact]
    public void BuildModulePermissions_ShouldAllowManagement_ForRssi()
    {
        var actor = DocumentationAccessControl.BuildActorContext(
            userId: "u-rssi",
            societeId: 1,
            roles: [ "RSSI" ]);

        var permissions = DocumentationAccessControl.BuildModulePermissions(actor);

        permissions.CanConsult.Should().BeTrue();
        permissions.CanCreate.Should().BeTrue();
        permissions.CanEditAny.Should().BeTrue();
        permissions.CanDelete.Should().BeTrue();
        permissions.CanApprove.Should().BeTrue();
        permissions.CanCreateVersion.Should().BeTrue();
    }

    [Fact]
    public void CanCreateDocument_ShouldAllowOnlyRssi()
    {
        var admin = DocumentationAccessControl.BuildActorContext("u-admin", 1, [ "Admin Societe" ]);
        var rssi = DocumentationAccessControl.BuildActorContext("u-rssi", 1, [ "RSSI" ]);

        DocumentationAccessControl.CanCreateDocument(admin, "securite", "brouillon").Should().BeFalse();
        DocumentationAccessControl.CanCreateDocument(rssi, "securite", "brouillon").Should().BeTrue();
    }

    [Fact]
    public void CanEditDeleteApprove_ShouldRespectRoleAndSociete()
    {
        var document = CreateDocument(societeId: 1, createdByUserId: "u-rssi", status: "brouillon");

        var rssi = DocumentationAccessControl.BuildActorContext("u-rssi", 1, [ "RSSI" ]);
        var admin = DocumentationAccessControl.BuildActorContext("u-admin", 1, [ "Admin Societe" ]);
        var outsider = DocumentationAccessControl.BuildActorContext("u-other", 2, [ "RSSI" ]);

        DocumentationAccessControl.CanEditDocument(rssi, document, "securite", "brouillon").Should().BeTrue();
        DocumentationAccessControl.CanDeleteDocument(rssi, document).Should().BeTrue();
        DocumentationAccessControl.CanApproveDocument(rssi, document).Should().BeTrue();

        DocumentationAccessControl.CanEditDocument(admin, document, "securite", "brouillon").Should().BeFalse();
        DocumentationAccessControl.CanDeleteDocument(admin, document).Should().BeFalse();
        DocumentationAccessControl.CanApproveDocument(admin, document).Should().BeFalse();

        DocumentationAccessControl.CanEditDocument(outsider, document, "securite", "brouillon").Should().BeFalse();
        DocumentationAccessControl.CanDeleteDocument(outsider, document).Should().BeFalse();
    }

    [Fact]
    public void CanViewDocument_ShouldDenySuperAdmin()
    {
        var document = CreateDocument(societeId: 1, createdByUserId: "u-rssi", status: "brouillon");
        var superAdmin = DocumentationAccessControl.BuildActorContext("u-super", 1, [ "Super Admin" ]);
        var consultant = DocumentationAccessControl.BuildActorContext("u-consult", 1, [ "Consultant" ]);

        DocumentationAccessControl.CanViewDocument(superAdmin, document).Should().BeFalse();
        DocumentationAccessControl.CanViewDocument(consultant, document).Should().BeTrue();
    }

    [Fact]
    public void CanCreateVersionDocument_ShouldRequireApprovedDocument_AndRssi()
    {
        var approvedDoc = CreateDocument(societeId: 1, createdByUserId: "u-rssi", status: "approuve");
        var draftDoc = CreateDocument(societeId: 1, createdByUserId: "u-rssi", status: "brouillon");

        var rssi = DocumentationAccessControl.BuildActorContext("u-rssi", 1, [ "RSSI" ]);
        var consultant = DocumentationAccessControl.BuildActorContext("u-consult", 1, [ "Consultant" ]);

        DocumentationAccessControl.CanCreateVersionDocument(rssi, approvedDoc).Should().BeTrue();
        DocumentationAccessControl.CanCreateVersionDocument(rssi, draftDoc).Should().BeFalse();
        DocumentationAccessControl.CanCreateVersionDocument(consultant, approvedDoc).Should().BeFalse();
    }

    private static DocumentationDocument CreateDocument(int societeId, string createdByUserId, string status)
    {
        return new DocumentationDocument
        {
            Id = Guid.NewGuid(),
            SocieteId = societeId,
            Name = "Document Test",
            Type = "procedure",
            Category = "securite",
            Status = status,
            Version = "1.0",
            Classification = "interne",
            Author = "Auteur Test",
            CreatedByUserId = createdByUserId,
            LastModifiedByUserId = createdByUserId
        };
    }
}
