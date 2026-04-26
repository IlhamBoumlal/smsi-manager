using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Modules.Queries.GetModuleById
{
    public class GetModuleByIdQuery : IRequest<Module?>
    {
        public string Id { get; set; } = string.Empty;
    }
}
