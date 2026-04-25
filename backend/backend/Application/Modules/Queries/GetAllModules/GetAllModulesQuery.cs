using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Modules.Queries.GetAllModules
{
    public class GetAllModulesQuery : IRequest<List<Module>>
    {
    }
}
