using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Commands.CreateAction
{
    public class CreateActionHandler : IRequestHandler<CreateActionCommand, Action>
    {
        private readonly IActionRepository _repo;

        public CreateActionHandler(IActionRepository repo)
        {
            _repo = repo;
        }

        public async Task<Action> Handle(CreateActionCommand request, CancellationToken ct)
        {
            if (await _repo.ActionExistsAsync(request.Code))
                throw new InvalidOperationException($"Une action avec le code '{request.Code}' existe déjà");

            var action = new Action
            {
                Code = request.Code,
                Name = request.Name,
                
            };

            return await _repo.CreateActionAsync(action);
        }
    }
}
