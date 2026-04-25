using backend.Application.Modules.Commands.CreateModule;
using backend.Application.Modules.Commands.DeleteModule;
using backend.Application.Modules.Commands.UpdateModule;
using backend.Application.Modules.Queries.GetAllModules;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ModuleController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ModuleController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllModules()
        {
            var modules = await _mediator.Send(new GetAllModulesQuery());
            return Ok(modules);
        }

        [HttpPost]
        public async Task<IActionResult> CreateModule([FromBody] CreateModuleCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateModule(string id, [FromBody] UpdateModuleCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModule(string id)
        {
            var result = await _mediator.Send(new DeleteModuleCommand { Id = id });
            return Ok(result);
        }
    }
}
