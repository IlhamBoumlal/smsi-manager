using backend.API.Hubs;
using backend.Application.DTOs.Controles;
using backend.Application.Services;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using backend.Infrastructure.Services;
using FluentEmail.Core;
using FluentEmail.Smtp;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
const string NotificationHubPath = "/notificationHub";

// Base de donnees
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }
});

// Identity
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

// JWT
builder.Services.AddAuthentication(opt =>
{
    opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(opt =>
{
    var jwtKey = builder.Configuration["Jwt:Key"];
    if (string.IsNullOrWhiteSpace(jwtKey))
    {
        throw new InvalidOperationException("JWT key is missing. Configure Jwt:Key via secure configuration.");
    }

    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    opt.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments(NotificationHubPath))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SignalRNotificationUser", policy =>
        policy.RequireAuthenticatedUser()
              .RequireAssertion(context =>
                  context.User.HasClaim(c => c.Type == ClaimTypes.Email || c.Type == "email")));
});

// CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowReact", p =>
        p.WithOrigins("http://localhost:3000", "http://localhost:5173")
         .AllowAnyMethod()
         .AllowAnyHeader()
         .AllowCredentials());
});

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Email
var emailConfig = builder.Configuration.GetSection("Email");
var smtpHost = emailConfig["SmtpHost"] ?? emailConfig["SmtpServer"];
var smtpPortRaw = emailConfig["SmtpPort"];
var smtpPort = int.TryParse(smtpPortRaw, out var parsedSmtpPort) ? parsedSmtpPort : 587;
var smtpUser = emailConfig["SmtpUser"];
var smtpPassword = emailConfig["SmtpPassword"] ?? emailConfig["SmtpPass"];
var fromEmail = emailConfig["FromAddress"] ?? emailConfig["FromEmail"];
var fromName = emailConfig["FromName"] ?? "SMSI Manager";

if (string.IsNullOrWhiteSpace(fromEmail))
{
    fromEmail = "disabled@local.invalid";
}

var emailBuilder = builder.Services.AddFluentEmail(fromEmail, fromName);
if (!string.IsNullOrWhiteSpace(smtpHost) &&
    !string.IsNullOrWhiteSpace(smtpUser) &&
    !string.IsNullOrWhiteSpace(smtpPassword))
{
    emailBuilder.AddSmtpSender(smtpHost, smtpPort, smtpUser, smtpPassword);
}

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 102400;
});

builder.Services.AddMemoryCache();

// MediatR
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});

// Repositories
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

// Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IDocumentationProofLinkService, DocumentationProofLinkService>();
builder.Services.AddScoped<IClauseService, ClauseService>();
builder.Services.AddScoped<IEmailServiceIncident, EmailServiceIncident>();
builder.Services.AddScoped<IEmailServiceSens, FormationEmailService>();

builder.Services.AddHostedService<RappelHostedService>();

var app = builder.Build();

// Initialisation BDD
using (var scope = app.Services.CreateScope())
{
    try
    {
        await DbInitializer.InitializeAsync(scope.ServiceProvider);
        Console.WriteLine("Initialisation de la base de donnees terminee avec succes");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erreur lors de l'initialisation: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// Pipeline
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
app.MapHub<NotificationHub>(NotificationHubPath)
   .RequireCors("AllowReact")
   .RequireAuthorization("SignalRNotificationUser");

app.Run();



