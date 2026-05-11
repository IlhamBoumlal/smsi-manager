using backend.Application.Roles.Commands.CreateRole;
using backend.Application.Roles.Commands.DeleteRole;
using backend.Application.Roles.Commands.UpdateRole;
using backend.Application.Roles.Queries.GetAllRoles;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
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
            return Ok(roles.Select(r => new { id = r.Id, nom = r.Name }));
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "R�le cr�� avec succ�s" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleCommand command)
        {
            if (id != command.RoleId)
                return BadRequest(new { error = "L'ID dans l'URL ne correspond pas � l'ID du corps de la requ�te" });

            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "R�le mis � jour avec succ�s" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var command = new DeleteRoleCommand { RoleId = id };
            var result = await _mediator.Send(command);

            if (result.Succeeded)
                return Ok(new { message = "R�le supprim� avec succ�s" });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }
    }
}
