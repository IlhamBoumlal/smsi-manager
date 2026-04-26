using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Modules.Commands.DeleteModule
{
    public class DeleteModuleHandler : IRequestHandler<DeleteModuleCommand, bool>
    {
        private readonly IModuleRepository _repo;

        public DeleteModuleHandler(IModuleRepository repo)
        {
            _repo = repo;
        }

        public async Task<bool> Handle(DeleteModuleCommand request, CancellationToken ct)
        {
            return await _repo.DeleteModuleAsync(request.Id);
        }
    }
}
