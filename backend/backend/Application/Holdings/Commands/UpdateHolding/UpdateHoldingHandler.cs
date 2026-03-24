using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Holdings.Commands.UpdateHolding
{
    public class UpdateHoldingHandler : IRequestHandler<UpdateHoldingCommand, (bool, string?)>
    {
        private readonly IHoldingRepository _repo;
        public UpdateHoldingHandler(IHoldingRepository repo) => _repo = repo;

        public async Task<(bool, string?)> Handle(UpdateHoldingCommand req, CancellationToken ct)
        {
            var holding = await _repo.GetByIdAsync(req.Id);
            if (holding == null) return (false, "Holding introuvable.");

            if (string.IsNullOrWhiteSpace(req.Nom))
                return (false, "Le nom est requis.");

            holding.Nom = req.Nom;
            await _repo.UpdateAsync(holding);
            await _repo.SaveChangesAsync();
            return (true, null);
        }
    }
}
