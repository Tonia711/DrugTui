using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        [Authorize(Roles = "Admin,WarehouseStaff")]
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
                    dr.RejectedByUsername,
                    dr.RejectedAt,
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
        [Authorize(Roles = "DepartmentMember,User")]
        public IActionResult Create(CreateDepartmentRequestDto dto)
        {
            var requestNumber = dto.RequestNumber.Trim();
            if (_context.DepartmentRequests.Any(dr => dr.RequestNumber == requestNumber))
            {
                return BadRequest("Request number already exists.");
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized("Invalid token.");
            }

            var currentUser = _context.Users.FirstOrDefault(u => u.Id == currentUserId.Value);
            if (currentUser == null)
            {
                return Unauthorized("User not found.");
            }

            if (!currentUser.DepartmentId.HasValue)
            {
                return BadRequest("Department member must be assigned to a department.");
            }

            var departmentId = currentUser.DepartmentId.Value;
            var department = _context.Departments.FirstOrDefault(d => d.Id == departmentId);
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
                Status = "Pending Acceptance",
                DepartmentId = departmentId,
                RequestedByUserId = currentUserId,
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

        [HttpGet("mine")]
        [Authorize(Roles = "DepartmentMember,User")]
        public IActionResult GetMine([FromQuery] string? keyword)
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized("Invalid token.");
            }

            var currentUser = _context.Users.FirstOrDefault(u => u.Id == currentUserId.Value);
            if (currentUser == null)
            {
                return Unauthorized("User not found.");
            }

            if (!currentUser.DepartmentId.HasValue)
            {
                return BadRequest("Department member must be assigned to a department.");
            }

            var query = _context.DepartmentRequests
                .Where(dr => dr.DepartmentId == currentUser.DepartmentId.Value)
                .AsQueryable();

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
                    dr.RejectedByUsername,
                    dr.RejectedAt,
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

        [HttpGet("{requestNumber}")]
        [Authorize(Roles = "Admin,WarehouseStaff,DepartmentMember,User")]
        public IActionResult GetByRequestNumber(string requestNumber)
        {
            var normalizedRequestNumber = requestNumber.Trim();
            if (string.IsNullOrWhiteSpace(normalizedRequestNumber))
            {
                return BadRequest("Request number is required.");
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized("Invalid token.");
            }

            var currentUser = _context.Users.FirstOrDefault(u => u.Id == currentUserId.Value);
            if (currentUser == null)
            {
                return Unauthorized("User not found.");
            }

            var request = _context.DepartmentRequests
                .Where(dr => dr.RequestNumber == normalizedRequestNumber)
                .Select(dr => new
                {
                    dr.Id,
                    dr.RequestNumber,
                    dr.Status,
                    dr.RejectedByUsername,
                    dr.RejectedAt,
                    dr.DepartmentId,
                    DepartmentName = dr.Department.Name,
                    dr.RequestedByUserId,
                    RequestedByUsername = dr.RequestedByUser != null ? dr.RequestedByUser.Username : null,
                    dr.RequestedAt,
                    dr.Notes,
                    Items = dr.Items
                        .OrderBy(i => i.Id)
                        .Select(i => new
                        {
                            i.Id,
                            i.MedicationId,
                            MedicationName = i.Medication != null ? i.Medication.Name : null,
                            i.Description,
                            i.QuantityRequested,
                            i.QuantityApproved
                        })
                        .ToList()
                })
                .FirstOrDefault();

            if (request == null)
            {
                return NotFound("Department request not found.");
            }

            if (IsDepartmentMemberRole())
            {
                if (!currentUser.DepartmentId.HasValue || request.DepartmentId != currentUser.DepartmentId.Value)
                {
                    return Forbid();
                }
            }

            return Ok(request);
        }

        [HttpDelete("{requestNumber}")]
        [Authorize(Roles = "DepartmentMember,User")]
        public IActionResult DeleteRejectedOwnRequest(string requestNumber)
        {
            var normalizedRequestNumber = requestNumber.Trim();
            if (string.IsNullOrWhiteSpace(normalizedRequestNumber))
            {
                return BadRequest("Request number is required.");
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized("Invalid token.");
            }

            var request = _context.DepartmentRequests
                .FirstOrDefault(dr => dr.RequestNumber == normalizedRequestNumber);

            if (request == null)
            {
                return NotFound("Department request not found.");
            }

            if (request.RequestedByUserId != currentUserId.Value)
            {
                return Forbid();
            }

            if (!request.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Only rejected requests can be deleted by requester.");
            }

            _context.DepartmentRequests.Remove(request);
            _context.SaveChanges();
            return NoContent();
        }

        [HttpPut("{requestNumber}/status")]
        [Authorize(Roles = "Admin,WarehouseStaff")]
        public IActionResult UpdateStatus(string requestNumber, UpdateDepartmentRequestStatusDto dto)
        {
            var normalizedRequestNumber = requestNumber.Trim();
            if (string.IsNullOrWhiteSpace(normalizedRequestNumber))
            {
                return BadRequest("Request number is required.");
            }

            var nextStatus = dto.Status?.Trim();
            if (string.IsNullOrWhiteSpace(nextStatus))
            {
                return BadRequest("Status is required.");
            }

            var allowedTransitions = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Pending Acceptance"] = ["Rejected", "Accepted / Processing"],
                ["Accepted / Processing"] = ["Ready for Delivery"],
                ["Ready for Delivery"] = ["Dispatched"],
                ["Dispatched"] = ["Completed"],
            };

            var request = _context.DepartmentRequests
                .Include(dr => dr.Items)
                .FirstOrDefault(dr => dr.RequestNumber == normalizedRequestNumber);

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized("Invalid token.");
            }

            var currentUser = _context.Users.FirstOrDefault(u => u.Id == currentUserId.Value);
            if (currentUser == null)
            {
                return Unauthorized("User not found.");
            }

            if (request == null)
            {
                return NotFound("Department request not found.");
            }

            var currentStatus = request.Status;
            if (!allowedTransitions.TryGetValue(currentStatus, out var allowedNextStatuses) ||
                !allowedNextStatuses.Contains(nextStatus, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest($"Cannot change status from '{currentStatus}' to '{nextStatus}'.");
            }

            request.Status = nextStatus;
            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                request.Notes = dto.Notes.Trim();
            }

            if (nextStatus.Equals("Accepted / Processing", StringComparison.OrdinalIgnoreCase))
            {
                foreach (var item in request.Items)
                {
                    item.QuantityApproved = item.QuantityRequested;
                }
            }

            if (nextStatus.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
            {
                request.RejectedByUsername = currentUser.Username;
                request.RejectedAt = DateTime.UtcNow;
                foreach (var item in request.Items)
                {
                    item.QuantityApproved = 0;
                }
            }

            _context.SaveChanges();

            return Ok(new
            {
                request.Id,
                request.RequestNumber,
                request.Status,
                request.Notes
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

        private bool IsDepartmentMemberRole()
        {
            return User.IsInRole("DepartmentMember") || User.IsInRole("User");
        }
    }
}
