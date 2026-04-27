// backend.API/Controllers/PermissionController.cs
using backend.Application.DTOs.Permissions;
using backend.Application.Permissions;
using backend.Application.Permissions.Commands.AssignPermission;
using backend.Application.Permissions.Commands.RemovePermission;
using backend.Application.Permissions.Commands.RevokeAllModulePermissions;
using backend.Application.Permissions.Queries.GetRolePermissions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/roles/{roleId}/permissions")]
    public class PermissionController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PermissionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetRolePermissions(string roleId)
        {
            var result = await _mediator.Send(new GetRolePermissionsQuery { RoleId = roleId });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> GrantPermission(
            string roleId,
            [FromBody] PermissionRequestDto dto)
        {
            var result = await _mediator.Send(new GrantPermissionCommand
            {
                RoleId = roleId,
                ModuleId = dto.ModuleId,
                ActionId = dto.ActionId
            });

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message, permissionId = result.PermissionId });
        }

        [HttpDelete]
        public async Task<IActionResult> RevokePermission(
            string roleId,
            [FromBody] PermissionRequestDto dto)
        {
            var result = await _mediator.Send(new RevokePermissionCommand
            {
                RoleId = roleId,
                ModuleId = dto.ModuleId,
                ActionId = dto.ActionId
            });

            if (!result.Success)
                return NotFound(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        // NOUVEAU: Supprime toutes les permissions d'un module
        [HttpDelete("module/{moduleId}")]
        public async Task<IActionResult> RevokeAllModulePermissions(
            string roleId,
            string moduleId)
        {
            var result = await _mediator.Send(new RevokeAllModulePermissionsCommand
            {
                RoleId = roleId,
                ModuleId = moduleId
            });

            if (!result.Success)
                return BadRequest(new { message = result.Message, errors = result.Errors });

            return Ok(new { message = result.Message, deletedCount = result.DeletedCount });
        }
    }

    public class PermissionRequestDto
    {
        public string ModuleId { get; set; } = string.Empty;
        public string ActionId { get; set; } = string.Empty;
    }
}