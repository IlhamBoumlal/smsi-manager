using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Commands.UpdateAction
{
    public class UpdateActionHandler : IRequestHandler<UpdateActionCommand, Action>
    {
        private readonly IActionRepository _repo;

        public UpdateActionHandler(IActionRepository repo)
        {
            _repo = repo;
        }

        public async Task<Action> Handle(UpdateActionCommand request, CancellationToken ct)
        {
            var action = await _repo.GetActionByIdAsync(request.Id);
            if (action == null)
                throw new InvalidOperationException($"Action avec l'ID '{request.Id}' non trouvée");

            var existingAction = await _repo.GetActionByCodeAsync(request.Code);
            if (existingAction != null && existingAction.Id != request.Id)
                throw new InvalidOperationException($"Une action avec le code '{request.Code}' existe déjà");

            action.Code = request.Code;
            action.Name = request.Name;

            return await _repo.UpdateActionAsync(action);
        }
    }
}
