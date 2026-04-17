using backend.Application.DTOs.Risques;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Risques.Commands.CreateRiskStudy
{
    public class CreateRiskStudyHandler : IRequestHandler<CreateRiskStudyCommand, (bool Success, string? Error, RiskStudyDto? Data)>
    {
        private readonly IRiskStudyRepository _repository;

        public CreateRiskStudyHandler(IRiskStudyRepository repository)
        {
            _repository = repository;
        }

        public async Task<(bool Success, string? Error, RiskStudyDto? Data)> Handle(CreateRiskStudyCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentUserId) || !request.CurrentSocieteId.HasValue)
                return (false, "FORBIDDEN:NO_ACCESS_SCOPE", null);

            if (string.IsNullOrWhiteSpace(request.Name))
                return (false, "BAD_REQUEST:NAME_REQUIRED", null);

            var created = await _repository.CreateAsync(new RiskStudy
            {
                Name = request.Name.Trim(),
                Organization = request.Organization.Trim(),
                Description = request.Description.Trim(),
                Perimeter = request.Perimeter.Trim(),
                Author = request.Author.Trim(),
                PayloadJson = RiskStudyMapper.NormalizePayload(request.PayloadJson),
                SocieteId = request.CurrentSocieteId.Value,
                CreatedByUserId = request.CurrentUserId,
                LastModifiedByUserId = request.CurrentUserId
            });

            return (true, null, RiskStudyMapper.ToDto(created));
        }
    }
}
