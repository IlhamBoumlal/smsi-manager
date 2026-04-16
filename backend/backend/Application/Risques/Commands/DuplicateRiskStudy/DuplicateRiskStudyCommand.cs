using backend.Application.DTOs.Risques;
using MediatR;

namespace backend.Application.Risques.Commands.DuplicateRiskStudy
{
    public record DuplicateRiskStudyCommand(
        Guid Id,
        string CurrentUserId,
        int? CurrentSocieteId
    ) : IRequest<(bool Success, string? Error, RiskStudyDto? Data)>;
}
