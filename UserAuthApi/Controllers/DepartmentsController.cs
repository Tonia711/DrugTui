using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserAuthApi.Data;
using UserAuthApi.Models;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword)
        {
            var query = _context.Departments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(d => d.Name.Contains(keyword));
            }

            var departments = query
                .OrderBy(d => d.Name)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Description,
                    RequestCount = d.Requests.Count
                })
                .ToList();

            return Ok(departments);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult Create(CreateDepartmentDto dto)
        {
            var name = dto.Name.Trim();
            if (_context.Departments.Any(d => d.Name.ToLower() == name.ToLower()))
            {
                return BadRequest("Department name already exists.");
            }

            var department = new Department
            {
                Name = name,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim()
            };

            _context.Departments.Add(department);
            _context.SaveChanges();

            return Ok(new
            {
                department.Id,
                department.Name,
                department.Description
            });
        }
    }
}
