using backend.Application.DTOs.Risques;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Risques.Commands.UpdateRiskStudy
{
    public class UpdateRiskStudyHandler : IRequestHandler<UpdateRiskStudyCommand, (bool Success, string? Error, RiskStudyDto? Data)>
    {
        private readonly IRiskStudyRepository _repository;

        public UpdateRiskStudyHandler(IRiskStudyRepository repository)
        {
            _repository = repository;
        }

        public async Task<(bool Success, string? Error, RiskStudyDto? Data)> Handle(UpdateRiskStudyCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentUserId) || !request.CurrentSocieteId.HasValue)
                return (false, "FORBIDDEN:NO_ACCESS_SCOPE", null);

            if (string.IsNullOrWhiteSpace(request.Name))
                return (false, "BAD_REQUEST:NAME_REQUIRED", null);

            var existing = await _repository.GetByIdAsync(request.Id, request.CurrentSocieteId);
            if (existing is null)
                return (false, "NOT_FOUND:RISK_STUDY", null);

            var updated = await _repository.UpdateAsync(new RiskStudy
            {
                Id = request.Id,
                Name = request.Name.Trim(),
                Organization = request.Organization.Trim(),
                Description = request.Description.Trim(),
                Perimeter = request.Perimeter.Trim(),
                Author = request.Author.Trim(),
                PayloadJson = RiskStudyMapper.NormalizePayload(request.PayloadJson),
                LastModifiedByUserId = request.CurrentUserId
            });

            if (updated is null)
                return (false, "NOT_FOUND:RISK_STUDY", null);

            return (true, null, RiskStudyMapper.ToDto(updated));
        }
    }
}
