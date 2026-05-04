using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Actions.Commands.DeleteAction
{
    public class DeleteActionHandler : IRequestHandler<DeleteActionCommand, bool>
    {
        private readonly IActionRepository _repo;

        public DeleteActionHandler(IActionRepository repo)
        {
            _repo = repo;
        }

        public async Task<bool> Handle(DeleteActionCommand request, CancellationToken ct)
        {
            return await _repo.DeleteActionAsync(request.Id);
        }
    }
}
