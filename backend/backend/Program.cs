using backend.Application.Services;
using backend.Domain.Entities;
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
using System.Text;
using System.Text.Json.Serialization;
using System.Reflection;
using System.Runtime.CompilerServices;

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

// ─── DIAGNOSTIC TEMPORAIRE ────────────────────────────────────────────────────
// ─── DIAGNOSTIC DÉTAILLÉ ────────────────────────────────────────────────────
Console.WriteLine("=== DIAGNOSTIC DES ASSEMBLYS ===\n");

var assembliesToScan = new[]
{
    typeof(Program).Assembly,
    typeof(ClauseService).Assembly,
    typeof(AppDbContext).Assembly,
    typeof(ApplicationUser).Assembly,
    typeof(IClauseService).Assembly,
}
.Distinct()
.ToArray();

foreach (var asm in assembliesToScan)
{
    try
    {
        Console.WriteLine($"\n📦 Assembly: {asm.FullName}");
        Console.WriteLine($"   Location: {asm.Location}");

        var types = asm.GetTypes();
        Console.WriteLine($"   ✅ {types.Length} types chargés avec succès");

        // Afficher les types qui posent problème
        foreach (var type in types)
        {
            try
            {
                // Forcer l'initialisation du type
                RuntimeHelpers.RunClassConstructor(type.TypeHandle);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ⚠️ Problème avec {type.FullName}: {ex.Message}");
            }
        }
    }
    catch (ReflectionTypeLoadException ex)
    {
        Console.WriteLine($"\n❌ ERREUR de chargement pour: {asm.FullName}");
        Console.WriteLine($"   Location: {asm.Location}");

        for (int i = 0; i < ex.LoaderExceptions.Length; i++)
        {
            if (ex.LoaderExceptions[i] != null)
            {
                Console.WriteLine($"   → Exception {i + 1}: {ex.LoaderExceptions[i]!.Message}");
                if (ex.LoaderExceptions[i]!.InnerException != null)
                {
                    Console.WriteLine($"     Inner: {ex.LoaderExceptions[i]!.InnerException!.Message}");
                }
            }
        }

        // Afficher les types qui ont pu être chargés
        if (ex.Types != null)
        {
            Console.WriteLine($"   Types chargés partiellement: {ex.Types.Length}");
            foreach (var type in ex.Types.Where(t => t != null))
            {
                Console.WriteLine($"     - {type!.FullName}");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"\n❌ Autre erreur pour {asm.FullName}: {ex.Message}");
    }
}

Console.WriteLine("\n=== FIN DIAGNOSTIC ===\n");

// ─── MEDIATR ──────────────────────────────────────────────────────────────────
builder.Services.AddMediatR(cfg =>
{
    foreach (var asm in assembliesToScan)
    {
        try
        {
            cfg.RegisterServicesFromAssembly(asm);
        }
        catch (ReflectionTypeLoadException ex)
        {
            foreach (var loaderEx in ex.LoaderExceptions.Where(e => e != null))
                Console.WriteLine($"[MediatR Load Warning] {loaderEx!.Message}");
        }
    }
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

// Email services
builder.Services.AddScoped<IEmailService, FormationEmailService>();
builder.Services.AddHostedService<RappelHostedService>();

var app = builder.Build();

// ─── INITIALISATION BDD + ADMIN ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    await DbInitializer.InitializeAsync(scope.ServiceProvider);
    await SeedAdminAsync(scope.ServiceProvider);

    var clauseService = scope.ServiceProvider.GetRequiredService<IClauseService>();
    await clauseService.SeedClausesAsync();
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// ─── SEED ADMIN ───────────────────────────────────────────────────────────────
static async Task SeedAdminAsync(IServiceProvider services)
{
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    const string adminEmail = "admin@alexsys.com";
    const string adminPassword = "Admin@123456!";
    const string adminRole = "Admin";

    if (!await roleManager.RoleExistsAsync(adminRole))
        await roleManager.CreateAsync(new IdentityRole(adminRole));

    var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
    if (existingAdmin is null)
    {
        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            NomComplet = "Administrateur",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(admin, adminPassword);
        if (result.Succeeded)
            await userManager.AddToRoleAsync(admin, adminRole);
    }
}