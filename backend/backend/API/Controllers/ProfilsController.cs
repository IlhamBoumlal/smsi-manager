using backend.Application.Profils.Commands.CreateProfil;
using backend.Application.Profils.Commands.DeleteProfil;
using backend.Application.Profils.Commands.UpdateProfil;
using backend.Application.Profils.Queries.GetAllProfils;
using backend.Application.Profils.Queries.GetProfilById;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
   
        [ApiController]
        [Route("api/[controller]")]
        public class ProfilsController : ControllerBase
        {
            private readonly IMediator _mediator;

            public ProfilsController(IMediator mediator)
            {
                _mediator = mediator;
            }

            [HttpGet]
            public async Task<IActionResult> GetAll()
            {
                var result = await _mediator.Send(new GetAllProfilsQuery());
                return Ok(result);
            }

            [HttpGet("{id:guid}")]
            public async Task<IActionResult> GetById(Guid id)
            {
                var result = await _mediator.Send(new GetProfilByIdQuery(id));
                return result is null ? NotFound() : Ok(result);
            }

            [HttpPost]
            public async Task<IActionResult> Create([FromBody] CreateProfilCommand command)
            {
                var id = await _mediator.Send(command);
                return CreatedAtAction(nameof(GetById), new { id }, new { id });
            }

            [HttpPut("{id:guid}")]
            public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProfilCommand command)
            {
                if (id != command.Id) return BadRequest();
                var result = await _mediator.Send(command);
                return result ? NoContent() : NotFound();
            }

            [HttpDelete("{id:guid}")]
            public async Task<IActionResult> Delete(Guid id)
            {
                var result = await _mediator.Send(new DeleteProfilCommand(id));
                return result ? NoContent() : NotFound();
            }
        }
    }

