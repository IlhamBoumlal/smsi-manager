using backend.Application.DTOs.Risques;
using MediatR;

namespace backend.Application.Risques.Commands.UpdateRiskStudy
{
    public record UpdateRiskStudyCommand(
        Guid Id,
        string Name,
        string Organization,
        string Description,
        string Perimeter,
        string Author,
        string PayloadJson,
        string CurrentUserId,
        int? CurrentSocieteId
    ) : IRequest<(bool Success, string? Error, RiskStudyDto? Data)>;
}
