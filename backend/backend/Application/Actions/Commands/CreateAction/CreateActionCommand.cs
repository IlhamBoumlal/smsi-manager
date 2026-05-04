using backend.Domain.Entities;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Commands.CreateAction
{
    public class CreateActionCommand : IRequest<Action>
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
