using backend.Application.Risques.Queries.GetAllRiskStudies;
using backend.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace backend.UnitTests.Handlers.Risques;

public class GetAllRiskStudiesHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnEmpty_AndNotCallRepository_WhenScopeIsMissing()
    {
        var repository = new Mock<IRiskStudyRepository>();
        var handler = new GetAllRiskStudiesHandler(repository.Object);

        var result = await handler.Handle(
            new GetAllRiskStudiesQuery(
                Search: null,
                CurrentUserId: string.Empty,
                CurrentSocieteId: null),
            CancellationToken.None);

        result.Should().BeEmpty();
        repository.Verify(r => r.GetAllBySocieteAsync(It.IsAny<int>()), Times.Never);
    }
}
