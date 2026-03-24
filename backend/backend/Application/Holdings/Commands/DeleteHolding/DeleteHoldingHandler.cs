using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Holdings.Commands.DeleteHolding
{
    public class DeleteHoldingHandler : IRequestHandler<DeleteHoldingCommand, (bool, string?)>
    {
        private readonly IHoldingRepository _repo;
        public DeleteHoldingHandler(IHoldingRepository repo) => _repo = repo;

        public async Task<(bool, string?)> Handle(DeleteHoldingCommand req, CancellationToken ct)
        {
            var holding = await _repo.GetByIdAsync(req.Id);
            if (holding == null) return (false, "Holding introuvable.");

            await _repo.DeleteAsync(holding);
            await _repo.SaveChangesAsync();
            return (true, null);
        }
    }
}
