using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Queries.GetActionById.GetAllActions
{
    public class GetAllActionsHandler : IRequestHandler<GetAllActionsQuery, List<Action>>
    {
        private readonly IActionRepository _repo;

        public GetAllActionsHandler(IActionRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<Action>> Handle(GetAllActionsQuery request, CancellationToken ct)
        {
            return await _repo.GetAllActionsAsync();
        }
    }
}
