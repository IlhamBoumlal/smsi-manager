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

            var existing = await _repository.GetByIdAsync(request.Id);
            if (existing is null)
                return (false, "NOT_FOUND:RISK_STUDY");

            if (existing.SocieteId != request.CurrentSocieteId.Value)
                return (false, "FORBIDDEN:FOREIGN_SOCIETE_SCOPE");

            var deleted = await _repository.DeleteAsync(request.Id);
            return deleted
                ? (true, null)
                : (false, "NOT_FOUND:RISK_STUDY");
        }
    }
}
