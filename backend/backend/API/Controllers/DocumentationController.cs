using System.Text;
using backend.Application.Documentation.Commands.CreateDocumentation;
using backend.Application.Documentation.Commands.DeleteDocumentation;
using backend.Application.Documentation.Commands.NewDocumentationVersion;
using backend.Application.Documentation.Commands.UpdateDocumentation;
using backend.Application.Documentation;
using backend.Application.Documentation.Queries.GetAllDocumentation;
using backend.Application.Documentation.Queries.GetDocumentationById;
using backend.Application.DTOs.Documentation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using System.Security.Claims;

namespace backend.API.Controllers
{
    [Authorize(Policy = "SmSiSocieteScope")]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentationController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IWebHostEnvironment _environment;
        private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

        public DocumentationController(IMediator mediator, IWebHostEnvironment environment)
        {
            _mediator = mediator;
            _environment = environment;
        }

        private string CurrentUserId =>
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        private int? CurrentSocieteId
        {
            get
            {
                var value = User.FindFirstValue("SocieteId");
                return int.TryParse(value, out var parsed) ? parsed : null;
            }
        }

        private IReadOnlyCollection<string> CurrentRoles =>
            User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();

        [HttpGet("permissions")]
        public IActionResult GetPermissions()
        {
            var actor = DocumentationAccessControl.BuildActorContext(CurrentUserId, CurrentSocieteId, CurrentRoles);
            return Ok(DocumentationAccessControl.BuildModulePermissions(actor));
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? type,
            [FromQuery] string? status,
            [FromQuery] string? category)
        {
            var result = await _mediator.Send(new GetAllDocumentationQuery(
                search,
                type,
                status,
                category,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles));
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetDocumentationByIdQuery(
                id,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles));
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateDocumentationDto dto, IFormFile? file)
        {
            var command = new CreateDocumentationCommand(
                dto.Name,
                dto.Type,
                dto.Category,
                dto.Status,
                dto.Version,
                dto.Classification,
                dto.Author,
                dto.Approver,
                dto.Clause,
                dto.Controle,
                dto.Description,
                file,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles
            );

            var (success, error, data) = await _mediator.Send(command);
            if (!success && IsForbiddenError(error)) return Forbid();
            return success && data is not null
                ? CreatedAtAction(nameof(GetById), new { id = data.Id }, data)
                : BadRequest(error);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] UpdateDocumentationDto dto, IFormFile? file)
        {
            var command = new UpdateDocumentationCommand(
                id,
                dto.Name,
                dto.Type,
                dto.Category,
                dto.Status,
                dto.Version,
                dto.Classification,
                dto.Author,
                dto.Approver,
                dto.Clause,
                dto.Controle,
                dto.Description,
                dto.RemoveFile,
                file,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles
            );

            var (success, error, data) = await _mediator.Send(command);
            if (IsForbiddenError(error)) return Forbid();
            if (IsNotFoundError(error)) return NotFound();
            if (!success) return BadRequest(error);
            return data is null ? NotFound() : Ok(data);
        }

        [HttpPost("{id:guid}/new-version")]
        public async Task<IActionResult> PublishNewVersion(Guid id, [FromForm] NewDocumentationVersionDto dto, IFormFile? file)
        {
            var command = new NewDocumentationVersionCommand(
                id,
                dto.Name,
                dto.Type,
                dto.Category,
                dto.Version,
                dto.Classification,
                dto.Author,
                dto.Approver,
                dto.Clause,
                dto.Controle,
                dto.Description,
                dto.RemoveFile,
                file,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles
            );

            var (success, error, data) = await _mediator.Send(command);
            if (IsForbiddenError(error)) return Forbid();
            if (IsNotFoundError(error)) return NotFound();
            if (!success) return BadRequest(error);
            return data is null ? NotFound() : Ok(data);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var (success, error) = await _mediator.Send(new DeleteDocumentationCommand(
                id,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles));

            if (success) return NoContent();
            if (IsForbiddenError(error)) return Forbid();
            if (IsNotFoundError(error)) return NotFound();
            return BadRequest(error);
        }

        [HttpGet("{id:guid}/file")]
        public async Task<IActionResult> DownloadOriginalFile(Guid id)
        {
            var doc = await _mediator.Send(new GetDocumentationByIdQuery(
                id,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles));

            if (doc is null) return NotFound();
            if (string.IsNullOrWhiteSpace(doc.FilePath)) return NotFound("Aucun fichier associe.");

            var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var relativePath = doc.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var absolutePath = Path.Combine(webRoot, relativePath);

            if (!System.IO.File.Exists(absolutePath))
                return NotFound("Fichier introuvable.");

            var downloadName = string.IsNullOrWhiteSpace(doc.OriginalFileName)
                ? $"{SafeFileName(doc.Name)}{Path.GetExtension(absolutePath)}"
                : doc.OriginalFileName;

            var contentType = ResolveContentType(downloadName);
            return PhysicalFile(absolutePath, contentType, downloadName);
        }

        [HttpGet("{id:guid}/download")]
        public async Task<IActionResult> Download(Guid id, [FromQuery] string format = "pdf")
        {
            var doc = await _mediator.Send(new GetDocumentationByIdQuery(
                id,
                CurrentUserId,
                CurrentSocieteId,
                CurrentRoles));
            if (doc is null) return NotFound();

            var normalizedFormat = format.Trim().TrimStart('.').ToLowerInvariant();
            if (normalizedFormat is not ("pdf" or "docx" or "xlsx"))
                return BadRequest("Format invalide. Formats autorisÃ©s: pdf, docx, xlsx.");

            if (!string.IsNullOrWhiteSpace(doc.FilePath))
            {
                var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var relativePath = doc.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var absolutePath = Path.Combine(webRoot, relativePath);
                var currentExtension = Path.GetExtension(absolutePath).TrimStart('.').ToLowerInvariant();

                if (System.IO.File.Exists(absolutePath) && currentExtension == normalizedFormat)
                {
                    return PhysicalFile(
                        absolutePath,
                        GetMimeType(normalizedFormat),
                        $"{SafeFileName(doc.Name)}.{normalizedFormat}");
                }
            }

            var fallbackContent = BuildFallbackExport(doc, normalizedFormat);
            var fallbackBytes = Encoding.UTF8.GetBytes(fallbackContent);
            return File(
                fallbackBytes,
                GetMimeType(normalizedFormat),
                $"{SafeFileName(doc.Name)}.{normalizedFormat}");
        }

        private static string GetMimeType(string format) => format switch
        {
            "pdf" => "application/pdf",
            "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/octet-stream"
        };

        private static string SafeFileName(string name)
        {
            var invalid = Path.GetInvalidFileNameChars();
            return string.Join("_", name.Split(invalid, StringSplitOptions.RemoveEmptyEntries)).Trim();
        }

        private static string ResolveContentType(string fileName)
        {
            if (ContentTypeProvider.TryGetContentType(fileName, out var mime))
                return mime;
            return "application/octet-stream";
        }

        private static string BuildFallbackExport(DocumentationResponseDto doc, string format)
        {
            if (format == "xlsx")
            {
                var lines = new[]
                {
                    "Name,Type,Category,Status,Version,Classification,Author,Approver,Clause,Controle,UpdatedAt",
                    $"{EscapeCsv(doc.Name)},{EscapeCsv(doc.Type)},{EscapeCsv(doc.Category)},{EscapeCsv(doc.Status)},{EscapeCsv(doc.Version)},{EscapeCsv(doc.Classification)},{EscapeCsv(doc.Author)},{EscapeCsv(doc.Approver)},{EscapeCsv(doc.Clause)},{EscapeCsv(doc.Controle)},{doc.UpdatedAt:O}"
                };
                return string.Join(Environment.NewLine, lines);
            }

            var sb = new StringBuilder();
            sb.AppendLine("Documentation SMSI");
            sb.AppendLine($"Nom: {doc.Name}");
            sb.AppendLine($"Type: {doc.Type}");
            sb.AppendLine($"Categorie: {doc.Category}");
            sb.AppendLine($"Statut: {doc.Status}");
            sb.AppendLine($"Version: {doc.Version}");
            sb.AppendLine($"Classification: {doc.Classification}");
            sb.AppendLine($"Auteur: {doc.Author}");
            sb.AppendLine($"Approbateur: {doc.Approver ?? "-"}");
            sb.AppendLine($"Clause ISO: {doc.Clause ?? "-"}");
            sb.AppendLine($"Controle Annexe A: {doc.Controle ?? "-"}");
            sb.AppendLine($"Description: {doc.Description ?? "-"}");
            sb.AppendLine($"Mise a jour: {doc.UpdatedAt:O}");
            return sb.ToString();
        }

        private static string EscapeCsv(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            var sanitized = value.Replace("\"", "\"\"");
            return $"\"{sanitized}\"";
        }

        private static bool IsForbiddenError(string? error)
            => error?.StartsWith("FORBIDDEN", StringComparison.OrdinalIgnoreCase) == true;

        private static bool IsNotFoundError(string? error)
            => error?.StartsWith("NOT_FOUND", StringComparison.OrdinalIgnoreCase) == true;
    }
}
