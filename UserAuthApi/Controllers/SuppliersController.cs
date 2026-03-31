using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserAuthApi.Data;
using UserAuthApi.Models;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class SuppliersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SuppliersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword)
        {
            var query = _context.Suppliers.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(s =>
                    s.Name.Contains(keyword) ||
                    (s.Email != null && s.Email.Contains(keyword)) ||
                    (s.Phone != null && s.Phone.Contains(keyword)));
            }

            var suppliers = query
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Email,
                    s.Phone,
                    s.Address,
                    PurchaseOrderCount = s.PurchaseOrders.Count
                })
                .ToList();

            return Ok(suppliers);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult Create(CreateSupplierDto dto)
        {
            var name = dto.Name.Trim();
            if (_context.Suppliers.Any(s => s.Name.ToLower() == name.ToLower()))
            {
                return BadRequest("Supplier name already exists.");
            }

            var supplier = new Supplier
            {
                Name = name,
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim()
            };

            _context.Suppliers.Add(supplier);
            _context.SaveChanges();

            return Ok(new
            {
                supplier.Id,
                supplier.Name,
                supplier.Email,
                supplier.Phone,
                supplier.Address
            });
        }
    }
}
