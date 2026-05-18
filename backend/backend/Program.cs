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
using System.Net.Mail;
using System.Net;
using backend.Application.DTOs.Settings;
using backend.Application.Security;
using backend.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ─── BASE DE DONNÉES ──────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
               builder.Configuration.GetConnectionString("DefaultConnection"),
               sqlOptions => sqlOptions.EnableRetryOnFailure(
                   maxRetryCount: 5,
                   maxRetryDelay: TimeSpan.FromSeconds(10),
                   errorNumbersToAdd: new[] { 1205 }))
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

    // Configuration pour SignalR
    opt.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// ─── CORS ─────────────────────────────────────────────────────────────────────

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PlatformScope", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole(AppRoles.SuperAdmin));

    options.AddPolicy("SmsiTenantScope", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole(AppRoles.AdminSociete, AppRoles.Rssi, AppRoles.Consultant, AppRoles.Auditeur)
              .RequireClaim("SocieteId"));

    options.AddPolicy("TenantAdminScope", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole(AppRoles.AdminSociete)
              .RequireClaim("SocieteId"));

    // Compatibilité rétro: ancienne policy conservée mais alignée sur le scope SMSI.
    options.AddPolicy("SmSiSocieteScope", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole(AppRoles.AdminSociete, AppRoles.Rssi, AppRoles.Consultant, AppRoles.Auditeur)
              .RequireClaim("SocieteId"));
});

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowReact", p =>
        p.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:3001")
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

// ─── CONFIGURATION EMAIL CORRIGÉE ─────────────────────────────────────────────
var emailConfig = builder.Configuration.GetSection("Email");
var smtpServer = emailConfig["SmtpServer"] ?? "smtp.gmail.com";
var smtpPort = int.Parse(emailConfig["SmtpPort"] ?? "587");
var smtpUser = emailConfig["SmtpUser"];
var smtpPass = (emailConfig["SmtpPass"] ?? string.Empty).Replace(" ", string.Empty).Trim();  // Tolère les app passwords collés avec espaces
var fromEmail = emailConfig["FromEmail"];
var fromName = emailConfig["FromName"] ?? "SMSI Manager";

// Logs pour déboguer
Console.WriteLine($"📧 Configuration Email:");
Console.WriteLine($"   SmtpServer: {smtpServer}");
Console.WriteLine($"   SmtpPort: {smtpPort}");
Console.WriteLine($"   SmtpUser: {smtpUser}");
Console.WriteLine($"   SmtpPass length: {smtpPass?.Length ?? 0}");
Console.WriteLine($"   FromEmail: {fromEmail}");
Console.WriteLine($"   FromName: {fromName}");

if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
{
    Console.WriteLine("⚠️ ATTENTION: Les identifiants SMTP ne sont pas configurés!");
}
else
{
    Console.WriteLine("✅ Configuration SMTP trouvée");
}

// Création du client SMTP
var smtpClient = new SmtpClient(smtpServer, smtpPort)
{
    EnableSsl = true,
    UseDefaultCredentials = false,
    Credentials = new NetworkCredential(smtpUser, smtpPass),
    Timeout = 10000
};

// Enregistrement FluentEmail
builder.Services
    .AddFluentEmail(fromEmail, fromName)
    .AddSmtpSender(() => smtpClient);

// ─── SIGNALR ──────────────────────────────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 102400;
});

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

builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IPermissionRepository, PermissionRepository>();
builder.Services.AddScoped<IModuleRepository, ModuleRepository>();
builder.Services.AddScoped<IActionRepository, ActionRepository>();
builder.Services.AddScoped<IUserPermissionService, UserPermissionService>();

// ─── SERVICES D'INFRASTRUCTURE ────────────────────────────────────────────────
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IClauseService, ClauseService>();
builder.Services.AddScoped<IDocumentationProofLinkService, DocumentationProofLinkService>();
builder.Services.AddScoped<ICartographieDocumentationSyncService, CartographieDocumentationSyncService>();
builder.Services.AddScoped<IEmailServiceIncident, EmailServiceIncident>();
builder.Services.AddScoped<IEmailServiceSens, FormationEmailService>();

builder.Services.AddHostedService<RappelHostedService>();

//les settings de l'email monitoring
builder.Services.Configure<EmailMonitoringSettings>(
    builder.Configuration.GetSection("EmailMonitoring"));

// Ajouter le Background Service
builder.Services.AddHostedService<EmailMonitoringService>();

// Ajouter HttpClientFactory
builder.Services.AddHttpClient();


var app = builder.Build();

// ─── INITIALISATION BDD + ADMIN ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        await DbInitializer.InitializeAsync(scope.ServiceProvider);
        Console.WriteLine("✅ Initialisation de la base de données terminée avec succès");
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
app.UseMiddleware<UserActivityTraceMiddleware>();
app.UseStaticFiles();
app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

app.Run();
