// Application/Sensibilisation/Commands/DeleteFormation/DeleteFormationCommand.cs
using MediatR;

namespace backend.Application.Sensibilisation.Commands.DeleteFormation;

public record DeleteFormationCommand(Guid Id) : IRequest<bool>;