using MediatR;

namespace backend.Application.Modules.Commands.DeleteModule
{
    public class DeleteModuleCommand : IRequest<bool>
    {
        public string Id { get; set; } = string.Empty;
    }
}
