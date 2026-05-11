using backend.Domain.Entities;
using MediatR;

namespace backend.Application.Modules.Commands.UpdateModule
{
    public class UpdateModuleCommand : IRequest<Module>
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }
}
