using Microsoft.EntityFrameworkCore;
using UserAuthApi.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Identity;
using UserAuthApi.Models;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

// Enable CORS to allow requests from the frontend (localhost:5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Set up JWT authentication for securing API endpoints
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!))
        };
    });

// Register EF Core with PostgreSQL using connection string from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to support API controllers
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

// Enable Swagger for API documentation and include JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "UserAuthApi", Version = "v1" });

    // Define how JWT should be added in Swagger requests
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "format: Bearer {your_token}"
    });

    // Apply security requirement to all operations
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    var adminEmail = config["AdminSeed:Email"];
    var adminPassword = config["AdminSeed:Password"];
    var adminUsername = config["AdminSeed:Username"] ?? "admin";
    var adminBio = config["AdminSeed:Bio"];

    if (!string.IsNullOrWhiteSpace(adminEmail) &&
        !string.IsNullOrWhiteSpace(adminPassword) &&
        !db.Users.Any(u => u.Email == adminEmail))
    {
        var admin = new User
        {
            Username = adminUsername,
            Email = adminEmail,
            Role = "Admin",
            Bio = adminBio
        };

        var hasher = new PasswordHasher<User>();
        admin.PasswordHash = hasher.HashPassword(admin, adminPassword);

        db.Users.Add(admin);
        db.SaveChanges();
    }

    static int ParseLeadingInt(string text, int fallback = 0)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return fallback;
        }

        var firstToken = text.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "0";
        var normalized = firstToken.Replace(",", "");
        return int.TryParse(normalized, out var result) ? result : fallback;
    }

    static DateTime ParseUtc(string text, DateTime fallback)
    {
        if (DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dt))
        {
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }

        return fallback;
    }

    if (!db.StorageZones.Any())
    {
        db.StorageZones.AddRange(
            new StorageZone
            {
                Name = "Ambient",
                Description = "Room temperature storage area",
                Capacity = 100,
                CurrentCapacity = 75,
                TemperatureMin = 18,
                TemperatureMax = 24,
                HumidityMin = 40,
                HumidityMax = 50
            },
            new StorageZone
            {
                Name = "Cold Storage",
                Description = "Low temperature storage area",
                Capacity = 100,
                CurrentCapacity = 60,
                TemperatureMin = 4,
                TemperatureMax = 8,
                HumidityMin = 50,
                HumidityMax = 60
            },
            new StorageZone
            {
                Name = "Controlled",
                Description = "Controlled environment storage",
                Capacity = 100,
                CurrentCapacity = 90,
                TemperatureMin = 22,
                TemperatureMax = 26,
                HumidityMin = 35,
                HumidityMax = 45
            },
            new StorageZone
            {
                Name = "Frozen Storage",
                Description = "Ultra-low temperature storage",
                Capacity = 100,
                CurrentCapacity = 45,
                TemperatureMin = -18,
                TemperatureMax = -15,
                HumidityMin = 50,
                HumidityMax = 60
            }
        );
        db.SaveChanges();
    }

    if (!db.StorageShelves.Any())
    {
        var zoneMap = db.StorageZones.ToDictionary(z => z.Name, z => z.Id);
        var shelfSeeds = new[]
        {
            (Zone: "Ambient", Code: "A1"),
            (Zone: "Ambient", Code: "A2"),
            (Zone: "Ambient", Code: "A3"),
            (Zone: "Cold Storage", Code: "C1"),
            (Zone: "Cold Storage", Code: "C2"),
            (Zone: "Cold Storage", Code: "C3"),
            (Zone: "Controlled", Code: "B1"),
            (Zone: "Controlled", Code: "B2"),
            (Zone: "Controlled", Code: "B3"),
            (Zone: "Frozen Storage", Code: "F1"),
            (Zone: "Frozen Storage", Code: "F2"),
            (Zone: "Frozen Storage", Code: "F3"),
        };

        db.StorageShelves.AddRange(
            shelfSeeds
                .Where(s => zoneMap.ContainsKey(s.Zone))
                .Select(s => new StorageShelf
                {
                    StorageZoneId = zoneMap[s.Zone],
                    Code = s.Code,
                    IsActive = true
                })
        );
        db.SaveChanges();
    }

    if (!db.Suppliers.Any())
    {
        db.Suppliers.AddRange(
            new Supplier { Name = "PharmaCorp Ltd", Email = "contact@pharmacorp.local", Phone = "+64-9-100-1001", Address = "Auckland" },
            new Supplier { Name = "MediSupply Inc", Email = "contact@medisupply.local", Phone = "+64-9-100-1002", Address = "Auckland" },
            new Supplier { Name = "HealthPro Distributors", Email = "contact@healthpro.local", Phone = "+64-9-100-1003", Address = "Auckland" },
            new Supplier { Name = "GlobalMed Supply", Email = "contact@globalmed.local", Phone = "+64-9-100-1004", Address = "Auckland" }
        );
        db.SaveChanges();
    }

    if (!db.Medications.Any())
    {
        var medicationSeeds = new[]
        {
            ("Amoxicillin 100mg", "AMX2024001", "tablets", "5000 tablets", "2026-06-15", "PharmaCorp Ltd"),
            ("Insulin Glargine 100IU/ml", "INS2024045", "vials", "45 vials", "2025-12-25", "MediSupply Inc"),
            ("Paracetamol 500mg", "PAR2024022", "tablets", "28000 tablets", "2026-09-20", "MediSupply Inc"),
            ("Morphine Sulfate 10mg/ml", "MOR2024008", "ampoules", "35 ampoules", "2026-01-15", "HealthPro Distributors"),
            ("Azithromycin 250mg", "AZI2023166", "tablets", "0 tablets", "2024-11-15", "GlobalMed Supply"),
            ("Metformin 850mg", "MET2024098", "tablets", "3500 tablets", "2026-02-28", "PharmaCorp Ltd"),
            ("Lisinopril 10mg", "LIS2024112", "tablets", "2800 tablets", "2026-05-15", "GlobalMed Supply"),
            ("Omeprazole 20mg", "OME2024089", "capsules", "4200 capsules", "2025-11-20", "MediSupply Inc"),
            ("Atorvastatin 40mg", "ATO2024134", "tablets", "1800 tablets", "2026-01-10", "HealthPro Distributors"),
            ("Amlodipine 5mg", "AML2024067", "tablets", "3100 tablets", "2026-08-05", "GlobalMed Supply")
        };

        db.Medications.AddRange(
            medicationSeeds.Select(m => new Medication
            {
                Name = m.Item1,
                BatchNumber = m.Item2,
                Unit = m.Item3,
                StockQuantity = ParseLeadingInt(m.Item4),
                ReorderLevel = 100,
                ExpiryDate = m.Item5 == null ? null : ParseUtc(m.Item5, DateTime.UtcNow.AddYears(1)),
                Supplier = m.Item6,
                CreatedAt = DateTime.UtcNow
            })
        );
        db.SaveChanges();
    }

    if (!db.Departments.Any())
    {
        db.Departments.AddRange(
            new Department { Name = "Emergency Department", Description = "Emergency care" },
            new Department { Name = "ICU", Description = "Intensive care unit" },
            new Department { Name = "Surgical Ward", Description = "Surgery ward" },
            new Department { Name = "Pediatrics", Description = "Pediatrics" },
            new Department { Name = "Cardiology", Description = "Cardiology" },
            new Department { Name = "Oncology", Description = "Oncology" },
            new Department { Name = "Orthopedics", Description = "Orthopedics" },
            new Department { Name = "Neurology", Description = "Neurology" },
            new Department { Name = "Internal Medicine", Description = "Internal medicine" },
            new Department { Name = "Respiratory", Description = "Respiratory" }
        );
        db.SaveChanges();
    }

    if (!db.PurchaseOrders.Any())
    {
        var supplierIdByName = db.Suppliers.ToDictionary(s => s.Name, s => s.Id);
        var firstUserId = db.Users.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefault();

        if (supplierIdByName.TryGetValue("PharmaCorp Ltd", out var ord001SupplierId))
        {
            db.PurchaseOrders.Add(new PurchaseOrder
            {
                OrderNumber = "ORD-001",
                Status = "Pending Review",
                SupplierId = ord001SupplierId,
                CreatedByUserId = firstUserId,
                OrderDate = ParseUtc("2025-11-25 09:30", DateTime.UtcNow),
                CreatedAt = DateTime.UtcNow,
                Notes = "Seeded from frontend mock data",
                Items = new List<PurchaseOrderItem>
                {
                    new() { Description = "Amoxicillin 500mg Tablets", QuantityOrdered = 1000, QuantityReceived = 0 },
                    new() { Description = "Paracetamol 500mg Tablets", QuantityOrdered = 2000, QuantityReceived = 0 },
                    new() { Description = "Ibuprofen 400mg Tablets", QuantityOrdered = 800, QuantityReceived = 0 },
                    new() { Description = "Aspirin 100mg Tablets", QuantityOrdered = 1500, QuantityReceived = 0 },
                    new() { Description = "Metformin 850mg Tablets", QuantityOrdered = 500, QuantityReceived = 0 },
                    new() { Description = "Atorvastatin 40mg Tablets", QuantityOrdered = 600, QuantityReceived = 0 },
                    new() { Description = "Lisinopril 10mg Tablets", QuantityOrdered = 400, QuantityReceived = 0 },
                    new() { Description = "Omeprazole 20mg Capsules", QuantityOrdered = 750, QuantityReceived = 0 },
                    new() { Description = "Losartan 50mg Tablets", QuantityOrdered = 550, QuantityReceived = 0 },
                    new() { Description = "Amlodipine 5mg Tablets", QuantityOrdered = 650, QuantityReceived = 0 },
                    new() { Description = "Gabapentin 300mg Capsules", QuantityOrdered = 300, QuantityReceived = 0 },
                    new() { Description = "Sertraline 50mg Tablets", QuantityOrdered = 450, QuantityReceived = 0 },
                    new() { Description = "Levothyroxine 100mcg Tablets", QuantityOrdered = 700, QuantityReceived = 0 },
                    new() { Description = "Albuterol Inhaler", QuantityOrdered = 100, QuantityReceived = 0 },
                    new() { Description = "Ciprofloxacin 500mg Tablets", QuantityOrdered = 400, QuantityReceived = 0 }
                }
            });
        }

        var poSeeds = new[]
        {
            ("ORD-002", "Paracetamol 500mg - 5000 tablets", "MediSupply Inc", "2025-11-24 14:20", "Fully Received"),
            ("ORD-003", "Insulin Glargine 100uL/mL - 50 vials", "HealthPro Distributors", "2025-11-24 11:15", "Invoice Matched"),
            ("ORD-004", "Metformin 850mg - 2000 tablets", "PharmaCorp Ltd", "2025-11-23 16:45", "Invoice Mismatched"),
            ("ORD-005", "Lisinopril 10mg - 1500 tablets", "GlobalMed Supply", "2025-11-23 10:00", "Approved/Ordered"),
            ("ORD-006", "Omeprazole 20mg - 3000 capsules", "MediSupply Inc", "2025-11-22 13:30", "Partially Received"),
            ("ORD-007", "Atorvastatin 40mg - 2500 tablets", "HealthPro Distributors", "2025-11-22 09:15", "Invoice Mismatched"),
            ("ORD-008", "Levothyroxine 50mcg - 1000 tablets", "PharmaCorp Ltd", "2025-11-21 15:20", "Rejected"),
            ("ORD-009", "Amlodipine 5mg - 2000 tablets", "GlobalMed Supply", "2025-11-21 11:45", "Invoice Matched"),
            ("ORD-010", "Gabapentin 300mg - 1200 capsules", "MediSupply Inc", "2025-11-20 14:00", "Fully Received")
        };

        foreach (var seed in poSeeds)
        {
            if (!supplierIdByName.TryGetValue(seed.Item3, out var supplierId))
            {
                continue;
            }

            var quantity = ParseLeadingInt(seed.Item2.Split("-").LastOrDefault() ?? "0", 1);

            db.PurchaseOrders.Add(new PurchaseOrder
            {
                OrderNumber = seed.Item1,
                Status = seed.Item5,
                SupplierId = supplierId,
                CreatedByUserId = firstUserId,
                OrderDate = ParseUtc(seed.Item4, DateTime.UtcNow),
                CreatedAt = DateTime.UtcNow,
                Notes = "Seeded from frontend mock data",
                Items = new List<PurchaseOrderItem>
                {
                    new()
                    {
                        Description = seed.Item2,
                        QuantityOrdered = Math.Max(1, quantity),
                        QuantityReceived = 0
                    }
                }
            });
        }

        db.SaveChanges();
    }

    if (!db.DepartmentRequests.Any())
    {
        var departmentIdByName = db.Departments.ToDictionary(d => d.Name, d => d.Id);
        var firstUserId = db.Users.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefault();

        var requestSeeds = new[]
        {
            ("REQ-001", "Emergency Department", "Morphine 10mg - 50 ampoules", "2025-11-30 08:15", "Pending Acceptance", 50),
            ("REQ-002", "ICU", "Norepinephrine 4mg/4mL - 30 ampoules", "2025-11-30 07:45", "Accepted / Processing", 30),
            ("REQ-003", "Surgical Ward", "Cefazolin 1g - 100 vials", "2025-11-29 16:30", "Accepted / Processing", 100),
            ("REQ-004", "Pediatrics", "Amoxicillin Suspension 250mg/5mL - 20 bottles", "2025-11-29 14:20", "Ready for Delivery", 20),
            ("REQ-005", "Cardiology", "Atorvastatin 40mg - 500 tablets", "2025-11-29 11:00", "Dispatched", 500),
            ("REQ-006", "Oncology", "Ondansetron 8mg - 200 tablets", "2025-11-29 09:15", "Completed", 200),
            ("REQ-007", "Orthopedics", "Ibuprofen 600mg - 300 tablets", "2025-11-28 15:45", "Pending Acceptance", 300),
            ("REQ-008", "Neurology", "Gabapentin 300mg - 150 capsules", "2025-11-28 13:30", "Accepted / Processing", 150),
            ("REQ-009", "Internal Medicine", "Metformin 850mg - 400 tablets", "2025-11-28 10:20", "Dispatched", 400),
            ("REQ-010", "Respiratory", "Salbutamol Inhaler - 30 units", "2025-11-27 16:00", "Completed", 30)
        };

        foreach (var seed in requestSeeds)
        {
            if (!departmentIdByName.TryGetValue(seed.Item2, out var departmentId))
            {
                continue;
            }

            db.DepartmentRequests.Add(new DepartmentRequest
            {
                RequestNumber = seed.Item1,
                Status = seed.Item5,
                DepartmentId = departmentId,
                RequestedByUserId = firstUserId,
                RequestedAt = ParseUtc(seed.Item4, DateTime.UtcNow),
                Notes = "Seeded from frontend mock data",
                Items = new List<DepartmentRequestItem>
                {
                    new()
                    {
                        Description = seed.Item3,
                        QuantityRequested = Math.Max(1, seed.Item6),
                        QuantityApproved = seed.Item5 == "Pending Acceptance" ? 0 : Math.Max(1, seed.Item6)
                    }
                }
            });
        }

        db.SaveChanges();
    }
}

app.UseHttpsRedirection();

// Enable JWT authentication middleware
app.UseAuthentication();

// Enable route protection based on roles/claims
app.UseAuthorization();

// Map controller endpoints
app.MapControllers();

// Enable CORS for frontend access
app.UseCors("AllowFrontend");

// Enable Swagger UI for interactive API testing
app.UseSwagger();
app.UseSwaggerUI();

app.Run();
