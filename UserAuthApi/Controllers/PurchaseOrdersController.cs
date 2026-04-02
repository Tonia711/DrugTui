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
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseOrdersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword)
        {
            var query = _context.PurchaseOrders.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(po =>
                    po.OrderNumber.Contains(keyword) ||
                    po.Status.Contains(keyword) ||
                    po.Supplier.Name.Contains(keyword));
            }

            var purchaseOrders = query
                .OrderByDescending(po => po.OrderDate)
                .Select(po => new
                {
                    po.Id,
                    po.OrderNumber,
                    po.Status,
                    po.SupplierId,
                    SupplierName = po.Supplier.Name,
                    po.CreatedByUserId,
                    CreatedByUsername = po.CreatedByUser != null ? po.CreatedByUser.Username : null,
                    po.OrderDate,
                    po.CreatedAt,
                    po.Notes,
                    ItemCount = po.Items.Count,
                    QuantityOrderedTotal = po.Items.Sum(i => i.QuantityOrdered),
                    QuantityReceivedTotal = po.Items.Sum(i => i.QuantityReceived)
                })
                .ToList();

            return Ok(purchaseOrders);
        }

        [HttpGet("{orderNumber}")]
        public IActionResult GetByOrderNumber(string orderNumber)
        {
            if (string.IsNullOrWhiteSpace(orderNumber))
            {
                return BadRequest("Order number is required.");
            }

            var normalizedOrderNumber = orderNumber.Trim();

            var order = _context.PurchaseOrders
                .Where(po => po.OrderNumber == normalizedOrderNumber)
                .Select(po => new
                {
                    po.Id,
                    po.OrderNumber,
                    po.Status,
                    po.SupplierId,
                    SupplierName = po.Supplier.Name,
                    po.CreatedByUserId,
                    CreatedByUsername = po.CreatedByUser != null ? po.CreatedByUser.Username : null,
                    po.OrderDate,
                    po.CreatedAt,
                    po.Notes,
                    ItemCount = po.Items.Count,
                    QuantityOrderedTotal = po.Items.Sum(i => i.QuantityOrdered),
                    QuantityReceivedTotal = po.Items.Sum(i => i.QuantityReceived),
                    Items = po.Items
                        .OrderBy(i => i.Id)
                        .Select(i => new
                        {
                            i.Id,
                            i.Description,
                            i.MedicationId,
                            Unit = i.Medication != null ? i.Medication.Unit : null,
                            i.QuantityOrdered,
                            i.QuantityReceived
                        })
                        .ToList()
                })
                .FirstOrDefault();

            if (order == null)
            {
                return NotFound("Purchase order not found.");
            }

            return Ok(order);
        }

        [HttpPost]
        public IActionResult Create(CreatePurchaseOrderDto dto)
        {
            var orderNumber = dto.OrderNumber.Trim();
            if (_context.PurchaseOrders.Any(po => po.OrderNumber == orderNumber))
            {
                return BadRequest("Order number already exists.");
            }

            var supplier = _context.Suppliers.FirstOrDefault(s => s.Id == dto.SupplierId);
            if (supplier == null)
            {
                return BadRequest("Supplier does not exist.");
            }

            if (dto.Items.Count == 0)
            {
                return BadRequest("At least one purchase order item is required.");
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

            var purchaseOrder = new PurchaseOrder
            {
                OrderNumber = orderNumber,
                Status = dto.Status.Trim(),
                SupplierId = dto.SupplierId,
                CreatedByUserId = GetCurrentUserId(),
                OrderDate = dto.OrderDate ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                Items = dto.Items.Select(i => new PurchaseOrderItem
                {
                    MedicationId = i.MedicationId,
                    Description = i.Description.Trim(),
                    QuantityOrdered = i.QuantityOrdered,
                    QuantityReceived = 0
                }).ToList()
            };

            _context.PurchaseOrders.Add(purchaseOrder);
            _context.SaveChanges();

            return Ok(new
            {
                purchaseOrder.Id,
                purchaseOrder.OrderNumber,
                purchaseOrder.Status,
                purchaseOrder.SupplierId,
                SupplierName = supplier.Name,
                purchaseOrder.CreatedByUserId,
                purchaseOrder.OrderDate,
                purchaseOrder.CreatedAt,
                purchaseOrder.Notes,
                ItemCount = purchaseOrder.Items.Count,
                QuantityOrderedTotal = purchaseOrder.Items.Sum(i => i.QuantityOrdered)
            });
        }

        [HttpPut("{orderNumber}/status")]
        public IActionResult UpdateStatus(string orderNumber, UpdatePurchaseOrderStatusDto dto)
        {
            if (string.IsNullOrWhiteSpace(orderNumber))
            {
                return BadRequest("Order number is required.");
            }

            var targetStatus = dto.Status?.Trim() ?? string.Empty;
            if (targetStatus != "Approved/Ordered" && targetStatus != "Rejected")
            {
                return BadRequest("Status must be Approved/Ordered or Rejected.");
            }

            var order = _context.PurchaseOrders.FirstOrDefault(po => po.OrderNumber == orderNumber.Trim());
            if (order == null)
            {
                return NotFound("Purchase order not found.");
            }

            if (order.Status != "Pending Review")
            {
                return BadRequest("Only Pending Review orders can be updated from this screen.");
            }

            if (targetStatus == "Rejected" && string.IsNullOrWhiteSpace(dto.RejectionComment))
            {
                return BadRequest("Rejection comment is required.");
            }

            order.Status = targetStatus;
            if (targetStatus == "Rejected")
            {
                order.Notes = dto.RejectionComment!.Trim();
            }

            _context.SaveChanges();

            return Ok(new
            {
                order.Id,
                order.OrderNumber,
                order.Status,
                order.Notes
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
