using backend.Application.Dashboard.Queries.GetGlobalDashboard;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace backend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DashboardController(IMediator mediator) => _mediator = mediator;

        [HttpGet("global")]
        public async Task<IActionResult> GetGlobal() =>
            Ok(await _mediator.Send(new GetGlobalDashboardQuery()));
    }
}
