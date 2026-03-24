using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Actifs.Commands.DeleteActif
{
    public class DeleteActifHandler : IRequestHandler<DeleteActifCommand, bool>
    {
        private readonly IActifRepository _repository;
        public DeleteActifHandler(IActifRepository repository) => _repository = repository;

        public async Task<bool> Handle(DeleteActifCommand request, CancellationToken ct) =>
            await _repository.DeleteAsync(request.Id);
    }
}
