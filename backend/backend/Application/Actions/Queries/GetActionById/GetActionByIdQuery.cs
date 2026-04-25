using backend.Domain.Entities;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Queries.GetActionById
{
    public class GetActionByIdQuery : IRequest<Action?>
    {
        public string Id { get; set; } = string.Empty;
    }
}
