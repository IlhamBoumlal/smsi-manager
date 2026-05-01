using backend.Application.Actifs.Commands.CreateActif;
using backend.Application.Actifs.Commands.DeleteActif;
using backend.Application.Actifs.Commands.UpdateActif;
using backend.Application.Actifs.Queries.GetActifById;
using backend.Application.Actifs.Queries.GetAllActifs;
using backend.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ActifsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ActifsController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _mediator.Send(new GetAllActifsQuery()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetActifByIdQuery(id));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateActifCommand command)
        {
            var sanitizedCommand = command with
            {
                Nom = (command.Nom ?? string.Empty).Trim(),
                Description = command.Description?.Trim() ?? string.Empty
            };

            var validationErrors = ValidateActifInput(
                sanitizedCommand.Nom,
                sanitizedCommand.Type,
                sanitizedCommand.Categorie,
                sanitizedCommand.Classification);
            if (validationErrors.Count > 0)
            {
                return ValidationProblem(new ValidationProblemDetails(validationErrors)
                {
                    Title = "Le payload de l'actif est invalide.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var result = await _mediator.Send(sanitizedCommand);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateActifCommand command)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(new { message = "L'identifiant de l'actif est invalide." });
            }

            var sanitizedCommand = command with
            {
                Id = id,
                Nom = (command.Nom ?? string.Empty).Trim(),
                Description = command.Description?.Trim() ?? string.Empty
            };

            var validationErrors = ValidateActifInput(
                sanitizedCommand.Nom,
                sanitizedCommand.Type,
                sanitizedCommand.Categorie,
                sanitizedCommand.Classification);
            if (validationErrors.Count > 0)
            {
                return ValidationProblem(new ValidationProblemDetails(validationErrors)
                {
                    Title = "Le payload de l'actif est invalide.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var result = await _mediator.Send(sanitizedCommand);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _mediator.Send(new DeleteActifCommand(id));
            return deleted ? NoContent() : NotFound();
        }

        private static Dictionary<string, string[]> ValidateActifInput(
            string nom,
            TypeActif type,
            CategorieActif categorie,
            ClassificationActif classification)
        {
            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(nom))
            {
                errors["nom"] = new[] { "Le nom de l'actif est obligatoire." };
            }

            if (!Enum.IsDefined(type))
            {
                errors["type"] = new[] { "Le type d'actif est invalide." };
            }

            if (!Enum.IsDefined(categorie))
            {
                errors["categorie"] = new[] { "La catégorie d'actif est invalide." };
            }

            if (!Enum.IsDefined(classification))
            {
                errors["classification"] = new[] { "La classification d'actif est invalide." };
            }

            return errors;
        }
    }
}
