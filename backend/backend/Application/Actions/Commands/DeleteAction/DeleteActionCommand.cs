using MediatR;

namespace backend.Application.Actions.Commands.DeleteAction
{
    public class DeleteActionCommand : IRequest<bool>
    {
        public string Id { get; set; } = string.Empty;
    }
}
