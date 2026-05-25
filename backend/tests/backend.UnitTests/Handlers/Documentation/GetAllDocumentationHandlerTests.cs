using backend.Application.Documentation.Queries.GetAllDocumentation;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace backend.UnitTests.Handlers.Documentation;

public class GetAllDocumentationHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnEmpty_ForSuperAdmin()
    {
        var repository = new Mock<IDocumentationRepository>();
        repository.Setup(r => r.GetAllAsync(It.IsAny<int?>())).ReturnsAsync(
        [
            new DocumentationDocument
            {
                Id = Guid.NewGuid(),
                SocieteId = 1,
                Name = "Procedure 1",
                Type = "procedure",
                Category = "securite",
                Status = "brouillon",
                Version = "1.0",
                Classification = "interne",
                Author = "A1",
                CreatedByUserId = "u-rssi"
            }
        ]);

        var handler = new GetAllDocumentationHandler(repository.Object);
        var query = new GetAllDocumentationQuery(
            Search: null,
            Type: null,
            Status: null,
            Category: null,
            CurrentUserId: "u-super",
            CurrentSocieteId: 1,
            CurrentRoles: ["Super Admin"]);

        var result = (await handler.Handle(query, CancellationToken.None)).ToList();

        result.Should().BeEmpty();
    }
}
