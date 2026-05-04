// Application/Sensibilisation/Commands/UploadFormationDocument/UploadFormationDocumentCommand.cs
using MediatR;
using Microsoft.AspNetCore.Http;
using backend.Application.DTOs;

namespace backend.Application.Sensibilisation.Commands.UploadFormationDocument;

public record UploadFormationDocumentCommand(
    Guid FormationId,
    IFormFile File,
    int? SocieteId
) : IRequest<DocumentDto>;