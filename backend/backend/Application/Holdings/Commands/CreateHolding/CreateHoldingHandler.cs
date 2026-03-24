using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Holdings.Commands.CreateHolding
{
    public class CreateHoldingHandler : IRequestHandler<CreateHoldingCommand, (bool, string?)>
    {
        private readonly IHoldingRepository _repo;
        public CreateHoldingHandler(IHoldingRepository repo) => _repo = repo;

        public async Task<(bool, string?)> Handle(CreateHoldingCommand req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.Nom))
                return (false, "Le nom est requis.");

            await _repo.AddAsync(new Holding { Nom = req.Nom });
            await _repo.SaveChangesAsync();
            return (true, null);
        }
    }
}
