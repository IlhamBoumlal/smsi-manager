using backend.Application.DTOs.Risques;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Risques.Queries.GetRiskStudyById
{
    public class GetRiskStudyByIdHandler : IRequestHandler<GetRiskStudyByIdQuery, (bool Success, string? Error, RiskStudyDto? Data)>
    {
        private readonly IRiskStudyRepository _repository;

        public GetRiskStudyByIdHandler(IRiskStudyRepository repository)
        {
            _repository = repository;
        }

        public async Task<(bool Success, string? Error, RiskStudyDto? Data)> Handle(GetRiskStudyByIdQuery request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentUserId) || !request.CurrentSocieteId.HasValue)
                return (false, "FORBIDDEN:NO_ACCESS_SCOPE", null);

            var study = await _repository.GetByIdAsync(request.Id, request.CurrentSocieteId);
            if (study is null)
                return (false, "NOT_FOUND:RISK_STUDY", null);

            return (true, null, RiskStudyMapper.ToDto(study));
        }
    }
}
