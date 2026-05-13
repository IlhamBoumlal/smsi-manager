using backend.API.Hubs;
using backend.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace backend.API.Controllers
{
    [Authorize(Policy = "PlatformScope")]
    [ApiController]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        private readonly IEmailServiceIncident _emailService;
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public TestController(
            IEmailServiceIncident emailService,
            IUserRepository userRepository,
            IConfiguration configuration)
        {
            _emailService = emailService;
            _userRepository = userRepository;
            _configuration = configuration;
        }

        [HttpGet("email")]
        public async Task<IActionResult> TestEmail()
        {
            try
            {
                Console.WriteLine("🔍 Test email démarré...");

                var targetEmail = _configuration["Bootstrap:SuperAdmin:Email"] ?? "superadmin@smsi.local";

                // Test 1 : email direct sans passer par les users
                Console.WriteLine("📧 Envoi email direct...");
                var result = await _emailService.SendIncidentNotificationAsync(
                    targetEmail,
                    "Test Admin",
                    "Titre test incident",
                    "Description test"
                );

                Console.WriteLine($"Résultat envoi: {result}");
                return Ok(new { success = result, message = "Vérifiez la console" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ EXCEPTION: {ex.GetType().Name}");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner Stack: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, new
                {
                    error = ex.Message,
                    inner = ex.InnerException?.Message,
                    type = ex.GetType().Name
                });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> TestUsers()
        {
            try
            {
                Console.WriteLine("🔍 Récupération des admins...");
                var admins = await _userRepository.GetUsersByRoleAsync("Admin Societe");
                var list = admins.ToList();
                Console.WriteLine($"✅ {list.Count} admin(s) trouvé(s)");
                foreach (var a in list)
                    Console.WriteLine($"  - {a.Email} | {a.NomComplet}");

                return Ok(new { count = list.Count, admins = list.Select(a => new { a.Email, a.NomComplet }) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ EXCEPTION users: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("signalr-test")]
        public async Task<IActionResult> TestSignalRNotification([FromServices] IHubContext<NotificationHub> hubContext)
        {
            try
            {
                var targetEmail = _configuration["Bootstrap:SuperAdmin:Email"] ?? "superadmin@smsi.local";
                var groupName = targetEmail.Replace("@", "_").Replace(".", "_");

                var testNotification = new
                {
                    type = "Test",
                    message = "Test de notification SignalR!",
                    titre = "Test Notification",
                    description = "Ceci est un test depuis le backend",
                    incidentId = Guid.NewGuid().ToString(),
                    priorite = "HAUTE",
                    date = DateTime.UtcNow
                };

                await hubContext.Clients.Group(groupName)
                    .SendAsync("ReceiveNotification", testNotification);

                Console.WriteLine($"✅ Test notification envoyée au groupe: {groupName}");

                return Ok(new
                {
                    success = true,
                    message = $"Notification envoyée à {targetEmail} (groupe: {groupName})",
                    groupName
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur test SignalR: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
