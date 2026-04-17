using backend.Application.DTOs.Controles;
using backend.Application.Services;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using backend.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using FluentEmail.Core;
using FluentEmail.Smtp;
using backend.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ─── BASE DE DONNÉES ──────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .EnableSensitiveDataLogging());

// ─── IDENTITY ─────────────────────────────────────────────────────────────────
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(opt =>
{
    opt.Password.RequiredLength = 8;
    opt.Password.RequireDigit = true;
    opt.Password.RequireUppercase = true;
    opt.Lockout.MaxFailedAccessAttempts = 5;
    opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    opt.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ─── JWT ──────────────────────────────────────────────────────────────────────
builder.Services.AddAuthentication(opt =>
{
    opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(opt =>
{
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowReact", p =>
        p.WithOrigins("http://localhost:3000", "http://localhost:5173")
         .AllowAnyMethod()
         .AllowAnyHeader()
         .AllowCredentials());
});

// ─── CONTROLLERS ──────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ─── CONFIGURATION FLUENTEMAIL ─────────────────────────────────────────────────
var emailConfig = builder.Configuration.GetSection("Email");
var smtpHost = emailConfig["SmtpHost"];
var smtpPort = int.Parse(emailConfig["SmtpPort"] ?? "587");
var smtpUser = emailConfig["SmtpUser"];
var smtpPassword = emailConfig["SmtpPassword"];
var fromEmail = emailConfig["FromAddress"];
var fromName = emailConfig["FromName"];

// Configuration de FluentEmail
builder.Services
    .AddFluentEmail(fromEmail, fromName)
    .AddSmtpSender(smtpHost, smtpPort, smtpUser, smtpPassword);

// ─── MEDIATR ──────────────────────────────────────────────────────────────────
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});

// ─── REPOSITORIES ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISocieteRepository, SocieteRepository>();
builder.Services.AddScoped<IHoldingRepository, HoldingRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IActifRepository, ActifRepository>();
builder.Services.AddScoped<IControleRepository, ControleRepository>();
builder.Services.AddScoped<IDocumentationRepository, DocumentationRepository>();
builder.Services.AddScoped<IPdcaRepository, PdcaRepository>();
builder.Services.AddScoped<IRiskStudyRepository, RiskStudyRepository>();
builder.Services.AddScoped<IFormationRepository, FormationRepository>();
builder.Services.AddScoped<IProcessusRepository, ProcessusRepository>();

// ─── SERVICES D'INFRASTRUCTURE ────────────────────────────────────────────────
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IClauseService, ClauseService>();
builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddSignalR();
builder.Services.AddHostedService<RappelHostedService>();

var app = builder.Build();

// ─── INITIALISATION BDD + ADMIN ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        await DbInitializer.InitializeAsync(scope.ServiceProvider);
        Console.WriteLine("✅ Initialisation de la base de données terminée avec succès");

        // Appel du seed des contrôles APRÈS l'initialisation de la BDD
        await SeedControlesAsync(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erreur lors de l'initialisation: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();

app.Run();

// ─── FONCTION SEED DES CONTRÔLES ─────────────────────────────────────────────
static async Task SeedControlesAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (await dbContext.Controles.AnyAsync())
    {
        Console.WriteLine("ℹ️ Contrôles déjà présents. Seed ignoré.");
        return;
    }

    // Chercher le fichier JSON à différents emplacements
    var jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "controles.json");

    if (!File.Exists(jsonPath))
    {
        jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "controles.json");
    }

    if (!File.Exists(jsonPath))
    {
        jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "controles.json");
    }

    if (!File.Exists(jsonPath))
    {
        Console.WriteLine($"⚠️ Fichier controles.json non trouvé. Chemins testés: {AppDomain.CurrentDomain.BaseDirectory}, {Directory.GetCurrentDirectory()}");
        return;
    }

    Console.WriteLine($"📁 Fichier trouvé: {jsonPath}");

    var options = new System.Text.Json.JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    try
    {
        var jsonContent = await File.ReadAllTextAsync(jsonPath);
        var dtos = System.Text.Json.JsonSerializer.Deserialize<List<ControleSeedDto>>(jsonContent, options);

        if (dtos is null || dtos.Count == 0)
        {
            Console.WriteLine("⚠️ Aucune donnée trouvée dans le fichier JSON");
            return;
        }

        var controles = new List<Controle>();

        foreach (var d in dtos)
        {
            // Conversion du domaine (string -> DomaineControle)
            var domaine = d.Domaine switch
            {
                "Organisationnel" => DomaineControle.Organisationnel,
                "Personnes" => DomaineControle.Personnes,
                "Physique" => DomaineControle.Physique,
                "Technologique" => DomaineControle.Technologique,
                _ => DomaineControle.Organisationnel
            };

            // Conversion du statut (string -> Statut)
            var statut = d.Statut switch
            {
                "NonEvalue" => Statut.NonEvalue,
                "Conforme" => Statut.Conforme,
                "Remarque" => Statut.Remarque,
                "NCMineure" => Statut.NCMineure,
                "NCMajeure" => Statut.NCMajeure,
                _ => Statut.NonEvalue
            };

            // Conversion de StatutPlan si présent
            StatutPlan? statutPlan = null;
            if (!string.IsNullOrEmpty(d.StatutPlan))
            {
                statutPlan = d.StatutPlan switch
                {
                    "NonDemarre" => StatutPlan.NonDemarre,
                    "EnCours" => StatutPlan.EnCours,
                    "Termine" => StatutPlan.Termine,
                    _ => StatutPlan.NonDemarre
                };
            }

            var controle = new Controle
            {
                Id = Guid.NewGuid(),
                Code = d.Code,
                Titre = d.Titre,
                Description = d.Description,
                Domaine = domaine,
                Applicable = d.Applicable,
                RaisonsApplicabilite = d.RaisonsApplicabilite != null
                    ? System.Text.Json.JsonSerializer.Serialize(d.RaisonsApplicabilite)
                    : null,
                RaisonExclusion = d.RaisonExclusion,
                Statut = statut,
                JustificationConformite = d.JustificationConformite,
                Remarque = d.Remarque,
                Preuves = d.Preuves,
                Steps = d.Steps != null
                    ? System.Text.Json.JsonSerializer.Serialize(d.Steps)
                    : null,
                Priorite = d.Priorite,
                StatutPlan = statutPlan,
                ResponsablePlan = d.ResponsablePlan,
                DateEcheance = d.DateEcheance,
                DateMiseAJour = d.DateMiseAJour ?? DateTime.UtcNow,
                DernierModificateurId = d.DernierModificateurId,
                DernierModificateurNom = d.DernierModificateurNom
            };

            controles.Add(controle);
        }

        await dbContext.Controles.AddRangeAsync(controles);
        await dbContext.SaveChangesAsync();
        Console.WriteLine($"✅ {controles.Count} contrôles ISO 27001 insérés avec succès.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erreur lors du seed des contrôles: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// ─── DTO POUR LA DÉSÉRIALISATION (correspond au format JSON) ─────────────────
public class ControleSeedDto
{
    public string Code { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Domaine { get; set; } = string.Empty;
    public bool Applicable { get; set; }
    public List<string>? RaisonsApplicabilite { get; set; }
    public string? RaisonExclusion { get; set; }
    public string Statut { get; set; } = "NonEvalue";
    public string? JustificationConformite { get; set; }
    public string? Remarque { get; set; }
    public string? Preuves { get; set; }
    public object? Steps { get; set; }
    public string? Priorite { get; set; }
    public string? StatutPlan { get; set; }
    public string? ResponsablePlan { get; set; }
    public DateTime? DateEcheance { get; set; }
    public DateTime? DateMiseAJour { get; set; }
    public string? DernierModificateurId { get; set; }
    public string? DernierModificateurNom { get; set; }
}