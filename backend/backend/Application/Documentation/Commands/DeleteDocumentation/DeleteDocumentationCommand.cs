using MediatR;

namespace backend.Application.Documentation.Commands.DeleteDocumentation
{
    public record DeleteDocumentationCommand(Guid Id) : IRequest<bool>;
}
