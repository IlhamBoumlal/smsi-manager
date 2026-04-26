using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Queries.GetActionById
{
    public class GetActionByIdHandler : IRequestHandler<GetActionByIdQuery, Action?>
    {
        private readonly IActionRepository _repo;

        public GetActionByIdHandler(IActionRepository repo)
        {
            _repo = repo;
        }

        public async Task<Action?> Handle(GetActionByIdQuery request, CancellationToken ct)
        {
            return await _repo.GetActionByIdAsync(request.Id);
        }
    }
}
