// Application/Sensibilisation/Commands/DeleteFormationDocument/DeleteFormationDocumentCommand.cs
using MediatR;

namespace backend.Application.Sensibilisation.Commands.DeleteFormationDocument;

public record DeleteFormationDocumentCommand(Guid FormationId, Guid DocumentId)
    : IRequest<bool>;