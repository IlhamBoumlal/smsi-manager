using backend.Application.DTOs.Risques;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Risques.Commands.DuplicateRiskStudy
{
    public class DuplicateRiskStudyHandler : IRequestHandler<DuplicateRiskStudyCommand, (bool Success, string? Error, RiskStudyDto? Data)>
    {
        private readonly IRiskStudyRepository _repository;

        public DuplicateRiskStudyHandler(IRiskStudyRepository repository)
        {
            _repository = repository;
        }

        public async Task<(bool Success, string? Error, RiskStudyDto? Data)> Handle(DuplicateRiskStudyCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentUserId) || !request.CurrentSocieteId.HasValue)
                return (false, "FORBIDDEN:NO_ACCESS_SCOPE", null);

            var source = await _repository.GetByIdAsync(request.Id);
            if (source is null)
                return (false, "NOT_FOUND:RISK_STUDY", null);

            if (source.SocieteId != request.CurrentSocieteId.Value)
                return (false, "FORBIDDEN:FOREIGN_SOCIETE_SCOPE", null);

            var duplicated = await _repository.CreateAsync(new RiskStudy
            {
                Name = $"{source.Name} (copie)",
                Organization = source.Organization,
                Description = source.Description,
                Perimeter = source.Perimeter,
                Author = source.Author,
                PayloadJson = RiskStudyMapper.NormalizePayload(source.PayloadJson),
                SocieteId = request.CurrentSocieteId.Value,
                CreatedByUserId = request.CurrentUserId,
                LastModifiedByUserId = request.CurrentUserId
            });

            return (true, null, RiskStudyMapper.ToDto(duplicated));
        }
    }
}
