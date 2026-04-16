using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using backend.Infrastructure.Services;
using Domain.Interfaces;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Text.Json.Serialization;
using backend.API.Hubs;


var builder = WebApplication.CreateBuilder(args);

// Configuration SMTP

// Juste avant la création du SmtpClient
var smtpUser = builder.Configuration["EmailSettings:SmtpUser"];
var smtpPass = builder.Configuration["EmailSettings:SmtpPass"];
Console.WriteLine($"🔍 SMTP User: {smtpUser}");
Console.WriteLine($"🔍 SMTP Pass length: {smtpPass?.Length} chars");
Console.WriteLine($"🔍 SMTP Pass: [{smtpPass}]");

var smtpClient = new SmtpClient
{
    Host = builder.Configuration["EmailSettings:SmtpServer"],
    Port = int.Parse(builder.Configuration["EmailSettings:SmtpPort"]!),
    EnableSsl = true,
    UseDefaultCredentials = false,
    Credentials = new NetworkCredential(smtpUser, smtpPass)
};
// Enregistrement FluentEmail
builder.Services
    .AddFluentEmail(builder.Configuration["EmailSettings:FromEmail"],
                    builder.Configuration["EmailSettings:FromName"])
    .AddSmtpSender(smtpClient);

// Enregistrement SignalR
builder.Services.AddSignalR();

// ─── BASE DE DONNÉES ──────────────────────────────────────────────────────────
/*builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));*/
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

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
        p.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:3001")
         .AllowAnyMethod()
         .AllowAnyHeader()
         .AllowCredentials());
});

// ─── CONTROLLERS ──────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        // Permet de convertir les strings en Enum automatiquement
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ─── MEDIATR ──────────────────────────────────────────────────────────────────
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
    cfg.RegisterServicesFromAssembly(
        typeof(backend.Application.Incidents.Commands.CreateIncident.CreateIncidentHandler).Assembly
    );
});

// ─── REPOSITORIES ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISocieteRepository, SocieteRepository>();
builder.Services.AddScoped<IHoldingRepository, HoldingRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IActifRepository, ActifRepository>();
builder.Services.AddScoped<IControleRepository, ControleRepository>();

builder.Services.AddScoped<IPdcaRepository, PdcaRepository>();
// ─── SERVICES D'INFRASTRUCTURE ────────────────────────────────────────────────
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IClauseService, ClauseService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();
// ─── SEED ADMIN ───────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    await SeedAdminAsync(scope.ServiceProvider);
    await SeedTraitantAsync(scope.ServiceProvider);
}
static async Task SeedAdminAsync(IServiceProvider services)
{
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    const string adminEmail = "boumlalilham@gmail.com";//admin@alexsys.com
    const string adminPassword = "Admin@123456!";
    const string adminRole = "Admin";

    // Créer le rôle Admin s'il n'existe pas
    if (!await roleManager.RoleExistsAsync(adminRole))
        await roleManager.CreateAsync(new IdentityRole(adminRole));

    // Créer l'utilisateur Admin s'il n'existe pas
    var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
    if (existingAdmin is null)
    {
        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            NomComplet = "Admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(admin, adminPassword);
        if (result.Succeeded)
            await userManager.AddToRoleAsync(admin, adminRole);
    }
}
static async Task SeedTraitantAsync(IServiceProvider services)
{
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    const string traitantEmail = "traitant@gmail.com";
    const string traitantPassword = "User@123456!";
    const string userRole = "User";

    // Créer le rôle User s'il n'existe pas
    if (!await roleManager.RoleExistsAsync(userRole))
    {
        await roleManager.CreateAsync(new IdentityRole(userRole));
        Console.WriteLine("✅ Rôle 'User' créé");
    }

    // Créer l'utilisateur traitant s'il n'existe pas
    var existingTraitant = await userManager.FindByEmailAsync(traitantEmail);
    if (existingTraitant is null)
    {
        var traitant = new ApplicationUser
        {
            UserName = traitantEmail,
            Email = traitantEmail,
            NomComplet = "Traitant Test",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(traitant, traitantPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(traitant, userRole);
            Console.WriteLine($"✅ Utilisateur traitant créé: {traitantEmail} / {traitantPassword}");
        }
        else
        {
            Console.WriteLine("❌ Erreur création utilisateur traitant:");
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"   - {error.Description}");
            }
        }
    }
    else
    {
        Console.WriteLine($"ℹ️ L'utilisateur traitant existe déjà: {traitantEmail}");
    }
}
// ─── PIPELINE ─────────────────────────────────────────────────────────────────
app.UseStaticFiles();
    app.UseRouting();
    app.UseCors("AllowReact");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<NotificationHub>("/notificationHub");


    app.Run();


