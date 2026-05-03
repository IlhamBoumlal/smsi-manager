using backend.Application.Actions.Commands.CreateAction;
using backend.Application.Actions.Commands.DeleteAction;
using backend.Application.Actions.Commands.UpdateAction;
using backend.Application.Actions.Queries.GetActionById.GetAllActions;
using backend.Application.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [Authorize(Roles = AppRoles.SuperAdmin)]
    [ApiController]
    [Route("api/actions")]
    public class ActionController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ActionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllActions()
        {
            var actions = await _mediator.Send(new GetAllActionsQuery());
            return Ok(actions);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAction([FromBody] CreateActionCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAction(string id, [FromBody] UpdateActionCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAction(string id)
        {
            var result = await _mediator.Send(new DeleteActionCommand { Id = id });
            return Ok(result);
        }
    }
}
