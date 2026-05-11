using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Risques.Commands.DeleteRiskStudy
{
    public class DeleteRiskStudyHandler : IRequestHandler<DeleteRiskStudyCommand, (bool Success, string? Error)>
    {
        private readonly IRiskStudyRepository _repository;

        public DeleteRiskStudyHandler(IRiskStudyRepository repository)
        {
            _repository = repository;
        }

        public async Task<(bool Success, string? Error)> Handle(DeleteRiskStudyCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentUserId) || !request.CurrentSocieteId.HasValue)
                return (false, "FORBIDDEN:NO_ACCESS_SCOPE");

            var existing = await _repository.GetByIdAsync(request.Id, request.CurrentSocieteId);
            if (existing is null)
                return (false, "NOT_FOUND:RISK_STUDY");

            var deleted = await _repository.DeleteAsync(request.Id, request.CurrentSocieteId);
            return deleted
                ? (true, null)
                : (false, "NOT_FOUND:RISK_STUDY");
        }
    }
}
