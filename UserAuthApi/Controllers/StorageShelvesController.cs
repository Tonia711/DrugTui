using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserAuthApi.Data;
using UserAuthApi.Models;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class StorageShelvesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StorageShelvesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] int? storageZoneId)
        {
            var query = _context.StorageShelves.AsQueryable();

            if (storageZoneId.HasValue)
            {
                query = query.Where(s => s.StorageZoneId == storageZoneId.Value);
            }

            var shelves = query
                .OrderBy(s => s.StorageZoneId)
                .ThenBy(s => s.Code)
                .Select(s => new
                {
                    s.Id,
                    s.StorageZoneId,
                    StorageZoneName = s.StorageZone.Name,
                    s.Code,
                    s.IsActive
                })
                .ToList();

            return Ok(shelves);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult Create(CreateStorageShelfDto dto)
        {
            var zone = _context.StorageZones.FirstOrDefault(z => z.Id == dto.StorageZoneId);
            if (zone == null)
            {
                return BadRequest("Storage zone does not exist.");
            }

            var code = dto.Code.Trim();
            if (_context.StorageShelves.Any(s => s.StorageZoneId == dto.StorageZoneId && s.Code.ToLower() == code.ToLower()))
            {
                return BadRequest("Shelf code already exists in this zone.");
            }

            var shelf = new StorageShelf
            {
                StorageZoneId = dto.StorageZoneId,
                Code = code,
                IsActive = dto.IsActive
            };

            _context.StorageShelves.Add(shelf);
            _context.SaveChanges();

            return Ok(new
            {
                shelf.Id,
                shelf.StorageZoneId,
                StorageZoneName = zone.Name,
                shelf.Code,
                shelf.IsActive
            });
        }
    }
}
