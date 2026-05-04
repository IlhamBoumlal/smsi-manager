using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Modules.Queries.GetAllModules
{
    public class GetAllModulesHandler : IRequestHandler<GetAllModulesQuery, List<Module>>
    {
        private readonly IModuleRepository _repo;

        public GetAllModulesHandler(IModuleRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<Module>> Handle(GetAllModulesQuery request, CancellationToken ct)
        {
            return await _repo.GetAllModulesAsync();
        }
    }
}
