using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Modules.Queries.GetModuleById
{
    public class GetModuleByIdHandler : IRequestHandler<GetModuleByIdQuery, Module?>
    {
        private readonly IModuleRepository _repo;

        public GetModuleByIdHandler(IModuleRepository repo)
        {
            _repo = repo;
        }

        public async Task<Module?> Handle(GetModuleByIdQuery request, CancellationToken ct)
        {
            return await _repo.GetModuleByIdAsync(request.Id);
        }
    }
}
