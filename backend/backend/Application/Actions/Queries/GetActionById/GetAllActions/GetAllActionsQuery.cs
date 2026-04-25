using backend.Domain.Entities;
using MediatR;
using Action = backend.Domain.Entities.Action;

namespace backend.Application.Actions.Queries.GetActionById.GetAllActions
{
    public class GetAllActionsQuery : IRequest<List<Action>>
    {
    }
}
