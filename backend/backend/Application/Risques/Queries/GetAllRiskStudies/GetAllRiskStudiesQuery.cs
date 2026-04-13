using backend.Application.DTOs.Risques;
using MediatR;

namespace backend.Application.Risques.Queries.GetAllRiskStudies
{
    public record GetAllRiskStudiesQuery(
        string? Search,
        string CurrentUserId,
        int? CurrentSocieteId
    ) : IRequest<IEnumerable<RiskStudyDto>>;
}
