using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;
using UserAuthApi.Data;
using UserAuthApi.Models;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class DepartmentRequestsController : ControllerBase
    {
        private sealed class MedicationLookup
        {
            public int Id { get; init; }
            public string Name { get; init; } = string.Empty;
            public string? GenericName { get; init; }
            public string? Strength { get; init; }
            public string? Unit { get; init; }
            public string? DosageForm { get; init; }
            public string? BatchNumber { get; init; }
            public DateTime? ExpiryDate { get; init; }
            public int StockQuantity { get; init; }
            public string? Storage { get; init; }
            public string? Location { get; init; }
        }

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
                    dr.DispatchedAt,
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

            var medicationCatalog = _context.Medications
                .Select(m => new MedicationLookup
                {
                    Id = m.Id,
                    Name = m.Name,
                    GenericName = m.GenericName,
                    Strength = m.Strength
                })
                .ToList();

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
                    MedicationId = i.MedicationId ?? FindBestMedicationIdByDescription(i.Description, medicationCatalog),
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
                    dr.DispatchedAt,
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
                .Include(dr => dr.Department)
                .Include(dr => dr.RequestedByUser)
                .Include(dr => dr.Items)
                    .ThenInclude(i => i.Medication)
                .FirstOrDefault(dr => dr.RequestNumber == normalizedRequestNumber);

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

            var medicationCatalog = _context.Medications
                .Select(m => new MedicationLookup
                {
                    Id = m.Id,
                    Name = m.Name,
                    GenericName = m.GenericName,
                    Strength = m.Strength,
                    Unit = m.Unit,
                    DosageForm = m.DosageForm,
                    BatchNumber = m.BatchNumber,
                    ExpiryDate = m.ExpiryDate,
                    StockQuantity = m.StockQuantity,
                    Storage = m.Storage,
                    Location = m.Location
                })
                .ToList();

            var response = new
            {
                request.Id,
                request.RequestNumber,
                request.Status,
                request.DispatchedAt,
                request.RejectedByUsername,
                request.RejectedAt,
                request.DepartmentId,
                DepartmentName = request.Department.Name,
                request.RequestedByUserId,
                RequestedByUsername = request.RequestedByUser != null ? request.RequestedByUser.Username : null,
                request.RequestedAt,
                request.Notes,
                Items = request.Items
                    .OrderBy(i => i.Id)
                    .Select(i =>
                    {
                        var matchedMedication = i.Medication != null
                            ? new MedicationLookup
                            {
                                Id = i.Medication.Id,
                                Name = i.Medication.Name,
                                GenericName = i.Medication.GenericName,
                                Strength = i.Medication.Strength,
                                Unit = i.Medication.Unit,
                                DosageForm = i.Medication.DosageForm,
                                BatchNumber = i.Medication.BatchNumber,
                                ExpiryDate = i.Medication.ExpiryDate,
                                StockQuantity = i.Medication.StockQuantity,
                                Storage = i.Medication.Storage,
                                Location = i.Medication.Location
                            }
                            : FindBestMedicationByDescription(i.Description, medicationCatalog);

                        return new
                        {
                            i.Id,
                            MedicationId = i.MedicationId ?? matchedMedication?.Id,
                            MedicationName = matchedMedication != null ? matchedMedication.Name : null,
                            GenericName = matchedMedication != null ? matchedMedication.GenericName : null,
                            Strength = matchedMedication != null ? matchedMedication.Strength : null,
                            Unit = matchedMedication != null ? matchedMedication.Unit : null,
                            DosageForm = matchedMedication != null ? matchedMedication.DosageForm : null,
                            i.Description,
                            i.QuantityRequested,
                            i.QuantityApproved,
                            BatchNumber = matchedMedication != null ? matchedMedication.BatchNumber : null,
                            ExpiryDate = matchedMedication != null ? matchedMedication.ExpiryDate : null,
                            StockQuantity = matchedMedication != null ? matchedMedication.StockQuantity : 0,
                            Storage = matchedMedication != null ? matchedMedication.Storage : null,
                            Location = matchedMedication != null ? matchedMedication.Location : null
                        };
                    })
                    .ToList()
            };

            return Ok(response);
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
                var approvedByItemId = (dto.ApprovedItems ?? new List<UpdateDepartmentRequestApprovedItemDto>())
                    .GroupBy(i => i.ItemId)
                    .ToDictionary(g => g.Key, g => g.Last().QuantityApproved);

                var invalidItemId = approvedByItemId.Keys
                    .FirstOrDefault(id => request.Items.All(item => item.Id != id));
                if (invalidItemId != 0)
                {
                    return BadRequest($"Item {invalidItemId} does not belong to this request.");
                }

                foreach (var item in request.Items)
                {
                    if (approvedByItemId.TryGetValue(item.Id, out var approvedQty))
                    {
                        if (approvedQty < 0 || approvedQty > item.QuantityRequested)
                        {
                            return BadRequest($"Approved quantity for item {item.Id} must be between 0 and requested quantity ({item.QuantityRequested}).");
                        }

                        item.QuantityApproved = approvedQty;
                    }
                    else
                    {
                        item.QuantityApproved = item.QuantityRequested;
                    }
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

            if (nextStatus.Equals("Dispatched", StringComparison.OrdinalIgnoreCase))
            {
                request.DispatchedAt = DateTime.UtcNow;
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

        private static int? FindBestMedicationIdByDescription(
            string description,
            List<MedicationLookup> medications)
        {
            var matched = FindBestMedicationByDescription(description, medications);
            return matched?.Id;
        }

        private static MedicationLookup? FindBestMedicationByDescription(
            string description,
            List<MedicationLookup> medications)
        {
            if (string.IsNullOrWhiteSpace(description) || medications.Count == 0)
            {
                return null;
            }

            var normalizedDescription = NormalizeForMatch(description);

            var candidates = medications
                .Select(m => new
                {
                    Medication = m,
                    Name = NormalizeForMatch(m.Name),
                    GenericName = NormalizeForMatch(m.GenericName)
                })
                .Where(x =>
                    (!string.IsNullOrWhiteSpace(x.Name) && normalizedDescription.Contains(x.Name, StringComparison.Ordinal)) ||
                    (!string.IsNullOrWhiteSpace(x.GenericName) && normalizedDescription.Contains(x.GenericName, StringComparison.Ordinal)))
                .OrderByDescending(x => Math.Max(x.Name.Length, x.GenericName.Length))
                .ThenByDescending(x => !string.IsNullOrWhiteSpace(x.Medication.Strength))
                .ThenByDescending(x => x.Medication.Id)
                .Select(x => x.Medication)
                .ToList();

            return candidates.FirstOrDefault();
        }

        private static string NormalizeForMatch(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var lowered = value.Trim().ToLowerInvariant();
            return Regex.Replace(lowered, "[^a-z0-9]+", string.Empty);
        }
    }
}
