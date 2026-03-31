using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserAuthApi.Data;
using UserAuthApi.Models;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class StorageZonesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StorageZonesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword)
        {
            var query = _context.StorageZones.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(z => z.Name.Contains(keyword));
            }

            var zones = query
                .OrderBy(z => z.Name)
                .Select(z => new
                {
                    z.Id,
                    z.Name,
                    z.Description,
                    z.Capacity,
                    z.CurrentCapacity,
                    z.TemperatureMin,
                    z.TemperatureMax,
                    z.HumidityMin,
                    z.HumidityMax,
                    ShelfCount = z.Shelves.Count
                })
                .ToList();

            return Ok(zones);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult Create(CreateStorageZoneDto dto)
        {
            var name = dto.Name.Trim();
            if (_context.StorageZones.Any(z => z.Name.ToLower() == name.ToLower()))
            {
                return BadRequest("Storage zone name already exists.");
            }

            if (dto.TemperatureMin > dto.TemperatureMax)
            {
                return BadRequest("Temperature min cannot be greater than max.");
            }

            if (dto.HumidityMin > dto.HumidityMax)
            {
                return BadRequest("Humidity min cannot be greater than max.");
            }

            if (dto.CurrentCapacity > dto.Capacity)
            {
                return BadRequest("Current capacity cannot exceed total capacity.");
            }

            var zone = new StorageZone
            {
                Name = name,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Capacity = dto.Capacity,
                CurrentCapacity = dto.CurrentCapacity,
                TemperatureMin = dto.TemperatureMin,
                TemperatureMax = dto.TemperatureMax,
                HumidityMin = dto.HumidityMin,
                HumidityMax = dto.HumidityMax
            };

            _context.StorageZones.Add(zone);
            _context.SaveChanges();

            return Ok(new
            {
                zone.Id,
                zone.Name,
                zone.Description,
                zone.Capacity,
                zone.CurrentCapacity,
                zone.TemperatureMin,
                zone.TemperatureMax,
                zone.HumidityMin,
                zone.HumidityMax
            });
        }
    }
}
