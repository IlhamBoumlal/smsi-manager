using MediatR;

namespace backend.Application.Risques.Commands.DeleteRiskStudy
{
    public record DeleteRiskStudyCommand(
        Guid Id,
        string CurrentUserId,
        int? CurrentSocieteId
    ) : IRequest<(bool Success, string? Error)>;
}
