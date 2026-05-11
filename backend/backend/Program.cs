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

var builder = WebApplication.CreateBuilder(args);

// â”€â”€â”€ BASE DE DONNÃ‰ES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .EnableSensitiveDataLogging());

// â”€â”€â”€ IDENTITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ JWT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SmSiSocieteScope", policy =>
        policy.RequireAuthenticatedUser()
              .RequireAssertion(context =>
                  context.User.HasClaim(c => c.Type == "SocieteId") ||
                  context.User.IsInRole(AppRoles.SuperAdmin) ||
                  context.User.IsInRole(AppRoles.AdminSociete)));
});

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowReact", p =>
        p.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:3001")
         .AllowAnyMethod()
         .AllowAnyHeader()
         .AllowCredentials());
});

// â”€â”€â”€ CONTROLLERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// â”€â”€â”€ CONFIGURATION EMAIL CORRIGÃ‰E â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var emailConfig = builder.Configuration.GetSection("Email");
var smtpServer = emailConfig["SmtpServer"] ?? "smtp.gmail.com";
var smtpPort = int.Parse(emailConfig["SmtpPort"] ?? "587");
var smtpUser = emailConfig["SmtpUser"];
var smtpPass = emailConfig["SmtpPass"];  // Note: c'est "SmtpPass" dans votre JSON
var fromEmail = emailConfig["FromEmail"];
var fromName = emailConfig["FromName"] ?? "SMSI Manager";

// Logs pour dÃ©boguer
Console.WriteLine($"ðŸ“§ Configuration Email:");
Console.WriteLine($"   SmtpServer: {smtpServer}");
Console.WriteLine($"   SmtpPort: {smtpPort}");
Console.WriteLine($"   SmtpUser: {smtpUser}");
Console.WriteLine($"   SmtpPass length: {smtpPass?.Length ?? 0}");
Console.WriteLine($"   FromEmail: {fromEmail}");
Console.WriteLine($"   FromName: {fromName}");

if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
{
    Console.WriteLine("âš ï¸ ATTENTION: Les identifiants SMTP ne sont pas configurÃ©s!");
}
else
{
    Console.WriteLine("âœ… Configuration SMTP trouvÃ©e");
}

// CrÃ©ation du client SMTP
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

// â”€â”€â”€ SIGNALR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 102400;
});

// â”€â”€â”€ MEDIATR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});

// â”€â”€â”€ REPOSITORIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ SERVICES D'INFRASTRUCTURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IClauseService, ClauseService>();
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

// â”€â”€â”€ INITIALISATION BDD + ADMIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
using (var scope = app.Services.CreateScope())
{
    try
    {
        await DbInitializer.InitializeAsync(scope.ServiceProvider);
        Console.WriteLine("âœ… Initialisation de la base de donnÃ©es terminÃ©e avec succÃ¨s");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"âŒ Erreur lors de l'initialisation: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// â”€â”€â”€ PIPELINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
app.MapHub<NotificationHub>("/notificationHub");

app.Run();
