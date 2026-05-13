using System.Security.Claims;
using System.Text.Json;
using backend.Application.Controles.Commands.UpdateControle;
using backend.Application.Controles.Queries.GetAllControles;
using backend.Application.Controles.Queries.GetControleById;
using backend.Application.DTOs.Controles;
using backend.Application.Security;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [Authorize(Policy = "SmsiTenantScope")]
    [ApiController]
    [Route("api/[controller]")]
    [RequirePermission("controles")]
    public class ControlesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IDocumentationProofLinkService _documentationProofLinkService;

        public ControlesController(
            IMediator mediator,
            IDocumentationProofLinkService documentationProofLinkService)
        {
            _mediator = mediator;
            _documentationProofLinkService = documentationProofLinkService;
        }

        private int? CurrentSocieteId => int.TryParse(User.FindFirstValue("SocieteId"), out var id) ? id : null;
        private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;
        private string CurrentUserName => User.FindFirstValue("NomComplet")
            ?? User.FindFirstValue("name")
            ?? CurrentUserId;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _mediator.Send(new GetAllControlesQuery(CurrentSocieteId)));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetControleByIdQuery(id, CurrentSocieteId));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateControleCommand command, CancellationToken ct)
        {
            var payload = command with
            {
                Id = id,
                SocieteId = CurrentSocieteId,
                ModifierId = string.IsNullOrWhiteSpace(command.ModifierId) ? CurrentUserId : command.ModifierId,
                ModifierNom = string.IsNullOrWhiteSpace(command.ModifierNom) ? CurrentUserName : command.ModifierNom
            };

            var (success, error, data) = await _mediator.Send(payload, ct);
            if (!success || data is null)
                return BadRequest(error);

            await SyncControlProofsToDocumentationAsync(
                payload.Preuves,
                data,
                payload.Remarque,
                payload.JustificationConformite,
                ct);

            return Ok(data);
        }

        private async Task SyncControlProofsToDocumentationAsync(
            string? preuvesJson,
            ControleDto controle,
            string? remarque,
            string? justificationConformite,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(preuvesJson) || string.IsNullOrWhiteSpace(CurrentUserId))
                return;

            List<ControlProofPayload>? payloads;
            try
            {
                payloads = JsonSerializer.Deserialize<List<ControlProofPayload>>(preuvesJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                return;
            }

            if (payloads is null || payloads.Count == 0) return;

            var controleReference = string.IsNullOrWhiteSpace(controle.Code)
                ? controle.Titre
                : controle.Code;
            var descriptionBase = string.IsNullOrWhiteSpace(remarque)
                ? justificationConformite
                : remarque;
            var controleDomaine = controle.Domaine switch
            {
                DomaineControle.Organisationnel => "Organisationnel",
                DomaineControle.Personnes => "Personnes",
                DomaineControle.Physique => "Physique",
                DomaineControle.Technologique => "Technologique",
                _ => controle.Domaine.ToString()
            };

            foreach (var payload in payloads)
            {
                var fileName = payload.Name?.Trim();
                var fileData = payload.Data?.Trim();
                if (string.IsNullOrWhiteSpace(fileName) || string.IsNullOrWhiteSpace(fileData))
                    continue;

                byte[] content;
                try
                {
                    content = Convert.FromBase64String(fileData);
                }
                catch
                {
                    continue;
                }

                try
                {
                    await _documentationProofLinkService.FindOrCreateFromBytesAndLinkAsync(
                        content,
                        fileName,
                        contentType: null,
                        currentUserId: CurrentUserId,
                        clauseReference: null,
                        controleReference: controleReference,
                        processusReference: null,
                        description: descriptionBase,
                        requestedType: null,
                        sourceModule: "controle",
                        controleDomaine: controleDomaine,
                        cancellationToken: cancellationToken);
                }
                catch
                {
                    // Ne pas bloquer la sauvegarde du contrôle.
                }
            }
        }

        private sealed record ControlProofPayload(string? Name, string? Data);
    }
}
