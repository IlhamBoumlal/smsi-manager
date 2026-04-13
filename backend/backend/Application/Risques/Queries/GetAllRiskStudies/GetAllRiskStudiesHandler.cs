using backend.Application.DTOs.Risques;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Risques.Queries.GetAllRiskStudies
{
    public class GetAllRiskStudiesHandler : IRequestHandler<GetAllRiskStudiesQuery, IEnumerable<RiskStudyDto>>
    {
        private readonly IRiskStudyRepository _repository;

        public GetAllRiskStudiesHandler(IRiskStudyRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<RiskStudyDto>> Handle(GetAllRiskStudiesQuery request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentUserId) || !request.CurrentSocieteId.HasValue)
                return Enumerable.Empty<RiskStudyDto>();

            var studies = await _repository.GetAllBySocieteAsync(request.CurrentSocieteId.Value);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                studies = studies.Where(s =>
                    s.Name.Contains(request.Search, StringComparison.OrdinalIgnoreCase)
                    || s.Organization.Contains(request.Search, StringComparison.OrdinalIgnoreCase)
                    || s.Description.Contains(request.Search, StringComparison.OrdinalIgnoreCase)
                    || s.Perimeter.Contains(request.Search, StringComparison.OrdinalIgnoreCase)
                    || s.Author.Contains(request.Search, StringComparison.OrdinalIgnoreCase));
            }

            return studies.Select(RiskStudyMapper.ToDto);
        }
    }
}
