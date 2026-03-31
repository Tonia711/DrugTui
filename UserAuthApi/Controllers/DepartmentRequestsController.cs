using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserAuthApi.Data;
using UserAuthApi.Models;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class DepartmentRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentRequestsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword)
        {
            var query = _context.DepartmentRequests.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(dr =>
                    dr.RequestNumber.Contains(keyword) ||
                    dr.Status.Contains(keyword) ||
                    dr.Department.Name.Contains(keyword));
            }

            var requests = query
                .OrderByDescending(dr => dr.RequestedAt)
                .Select(dr => new
                {
                    dr.Id,
                    dr.RequestNumber,
                    dr.Status,
                    dr.DepartmentId,
                    DepartmentName = dr.Department.Name,
                    dr.RequestedByUserId,
                    RequestedByUsername = dr.RequestedByUser != null ? dr.RequestedByUser.Username : null,
                    dr.RequestedAt,
                    dr.Notes,
                    ItemCount = dr.Items.Count,
                    QuantityRequestedTotal = dr.Items.Sum(i => i.QuantityRequested),
                    QuantityApprovedTotal = dr.Items.Sum(i => i.QuantityApproved)
                })
                .ToList();

            return Ok(requests);
        }

        [HttpPost]
        public IActionResult Create(CreateDepartmentRequestDto dto)
        {
            var requestNumber = dto.RequestNumber.Trim();
            if (_context.DepartmentRequests.Any(dr => dr.RequestNumber == requestNumber))
            {
                return BadRequest("Request number already exists.");
            }

            var department = _context.Departments.FirstOrDefault(d => d.Id == dto.DepartmentId);
            if (department == null)
            {
                return BadRequest("Department does not exist.");
            }

            if (dto.Items.Count == 0)
            {
                return BadRequest("At least one request item is required.");
            }

            var medicationIds = dto.Items
                .Where(i => i.MedicationId.HasValue)
                .Select(i => i.MedicationId!.Value)
                .Distinct()
                .ToList();

            var existingMedicationIds = _context.Medications
                .Where(m => medicationIds.Contains(m.Id))
                .Select(m => m.Id)
                .ToHashSet();

            var missingMedicationId = medicationIds.FirstOrDefault(id => !existingMedicationIds.Contains(id));
            if (missingMedicationId != 0)
            {
                return BadRequest($"Medication {missingMedicationId} does not exist.");
            }

            var request = new DepartmentRequest
            {
                RequestNumber = requestNumber,
                Status = dto.Status.Trim(),
                DepartmentId = dto.DepartmentId,
                RequestedByUserId = GetCurrentUserId(),
                RequestedAt = dto.RequestedAt ?? DateTime.UtcNow,
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                Items = dto.Items.Select(i => new DepartmentRequestItem
                {
                    MedicationId = i.MedicationId,
                    Description = i.Description.Trim(),
                    QuantityRequested = i.QuantityRequested,
                    QuantityApproved = i.QuantityApproved
                }).ToList()
            };

            _context.DepartmentRequests.Add(request);
            _context.SaveChanges();

            return Ok(new
            {
                request.Id,
                request.RequestNumber,
                request.Status,
                request.DepartmentId,
                DepartmentName = department.Name,
                request.RequestedByUserId,
                request.RequestedAt,
                request.Notes,
                ItemCount = request.Items.Count,
                QuantityRequestedTotal = request.Items.Sum(i => i.QuantityRequested)
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return null;
            }

            return int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }
    }
}
