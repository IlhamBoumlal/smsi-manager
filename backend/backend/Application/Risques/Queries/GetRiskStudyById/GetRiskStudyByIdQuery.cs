using backend.Application.DTOs.Risques;
using MediatR;

namespace backend.Application.Risques.Queries.GetRiskStudyById
{
    public record GetRiskStudyByIdQuery(
        Guid Id,
        string CurrentUserId,
        int? CurrentSocieteId
    ) : IRequest<(bool Success, string? Error, RiskStudyDto? Data)>;
}
