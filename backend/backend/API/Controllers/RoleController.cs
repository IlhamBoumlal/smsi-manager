using backend.Application.Roles.Commands.CreateRole;
using backend.Application.Roles.Commands.DeleteRole;
using backend.Application.Roles.Commands.UpdateRole;
using backend.Application.Roles.Queries.GetAllRoles;
using backend.Application.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [Authorize(Roles = AppRoles.SuperAdmin)]
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly IMediator _mediator;
        public RoleController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _mediator.Send(new GetAllRolesQuery());
            var finalRoleKeys = AppRoles.FinalRoles
                .ToDictionary(AppRoles.NormalizeKey, role => role, StringComparer.OrdinalIgnoreCase);

            var filtered = roles
                .Where(r => !string.IsNullOrWhiteSpace(r.Name) && finalRoleKeys.ContainsKey(AppRoles.NormalizeKey(r.Name)))
                .OrderBy(r => Array.IndexOf(AppRoles.FinalRoles, finalRoleKeys[AppRoles.NormalizeKey(r.Name)]))
                .Select(r => new { id = r.Id, nom = r.Name });

            return Ok(filtered);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "Rôle créé avec succès" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleCommand command)
        {
            if (id != command.RoleId)
                return BadRequest(new { error = "L'ID dans l'URL ne correspond pas à l'ID du corps de la requête" });

            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "Rôle mis à jour avec succès" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var command = new DeleteRoleCommand { RoleId = id };
            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "Rôle supprimé avec succès" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }
    }
}
