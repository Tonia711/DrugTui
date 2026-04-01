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
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvoicesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword, [FromQuery] string? status)
        {
            var query = _context.Invoices.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(inv =>
                    inv.InvoiceNumber.Contains(keyword) ||
                    (inv.Supplier != null && inv.Supplier.Name.Contains(keyword)) ||
                    (inv.PurchaseOrder != null && inv.PurchaseOrder.OrderNumber.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                status = status.Trim();
                query = query.Where(inv => inv.Status == status);
            }

            var invoices = query
                .OrderByDescending(inv => inv.InvoiceDate)
                .Select(inv => new
                {
                    inv.Id,
                    inv.InvoiceNumber,
                    inv.Status,
                    inv.SupplierId,
                    SupplierName = inv.Supplier != null ? inv.Supplier.Name : string.Empty,
                    PurchaseOrderNumber = inv.PurchaseOrder != null ? inv.PurchaseOrder.OrderNumber : string.Empty,
                    inv.TotalAmount,
                    inv.InvoiceDate,
                    inv.CreatedAt,
                    inv.Notes,
                    ItemCount = inv.Items.Count
                })
                .ToList();

            return Ok(invoices);
        }

        [HttpGet("{invoiceId:int}")]
        public IActionResult GetById(int invoiceId)
        {
            var invoice = _context.Invoices
                .Where(inv => inv.Id == invoiceId)
                .Select(inv => new
                {
                    inv.Id,
                    inv.InvoiceNumber,
                    inv.Status,
                    inv.PurchaseOrderId,
                    PurchaseOrderNumber = inv.PurchaseOrder != null ? inv.PurchaseOrder.OrderNumber : string.Empty,
                    inv.SupplierId,
                    SupplierName = inv.Supplier != null ? inv.Supplier.Name : string.Empty,
                    inv.TotalAmount,
                    inv.InvoiceDate,
                    inv.CreatedAt,
                    inv.UpdatedAt,
                    inv.Notes,
                    Items = inv.Items
                        .OrderBy(i => i.Id)
                        .Select(i => new
                        {
                            i.Id,
                            i.Description,
                            i.Quantity,
                            ReceivedQuantity = i.PurchaseOrderItem != null
                                ? i.PurchaseOrderItem.QuantityReceived
                                : (inv.PurchaseOrder != null
                                    ? inv.PurchaseOrder.Items
                                        .Where(poItem => poItem.Description == i.Description)
                                        .Select(poItem => (int?)poItem.QuantityReceived)
                                        .FirstOrDefault()
                                    : (int?)null),
                            PoQuantity = i.PurchaseOrderItem != null
                                ? i.PurchaseOrderItem.QuantityOrdered
                                : (inv.PurchaseOrder != null
                                    ? inv.PurchaseOrder.Items
                                        .Where(poItem => poItem.Description == i.Description)
                                        .Select(poItem => (int?)poItem.QuantityOrdered)
                                        .FirstOrDefault()
                                    : (int?)null),
                            i.Unit,
                            i.UnitPrice,
                            i.Amount,
                            i.PurchaseOrderItemId,
                            i.Notes
                        })
                        .ToList()
                })
                .FirstOrDefault();

            if (invoice == null)
            {
                return NotFound("Invoice not found.");
            }

            return Ok(invoice);
        }

        [HttpPost]
        public IActionResult Create(CreateInvoiceDto dto)
        {
            var invoiceNumber = dto.InvoiceNumber.Trim();
            if (_context.Invoices.Any(inv => inv.InvoiceNumber == invoiceNumber))
            {
                return BadRequest("Invoice number already exists.");
            }

            var purchaseOrder = _context.PurchaseOrders.FirstOrDefault(po => po.Id == dto.PurchaseOrderId);
            if (purchaseOrder == null)
            {
                return BadRequest("Purchase order does not exist.");
            }

            var supplier = _context.Suppliers.FirstOrDefault(s => s.Id == dto.SupplierId);
            if (supplier == null)
            {
                return BadRequest("Supplier does not exist.");
            }

            if (dto.Items.Count == 0)
            {
                return BadRequest("At least one invoice item is required.");
            }

            var invoice = new Invoice
            {
                InvoiceNumber = invoiceNumber,
                PurchaseOrderId = dto.PurchaseOrderId,
                SupplierId = dto.SupplierId,
                Status = "Pending",
                TotalAmount = dto.TotalAmount,
                InvoiceDate = dto.InvoiceDate ?? DateTime.UtcNow,
                Notes = dto.Notes,
                Items = dto.Items.Select(itemDto => new InvoiceItem
                {
                    Description = itemDto.Description.Trim(),
                    Quantity = itemDto.Quantity,
                    Unit = itemDto.Unit,
                    UnitPrice = itemDto.UnitPrice,
                    Amount = itemDto.Amount,
                    PurchaseOrderItemId = itemDto.PurchaseOrderItemId,
                    Notes = itemDto.Notes
                }).ToList()
            };

            _context.Invoices.Add(invoice);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetById), new { invoiceId = invoice.Id }, new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status
            });
        }

        [HttpPut("{invoiceId:int}/status")]
        public IActionResult UpdateStatus(int invoiceId, [FromBody] UpdateInvoiceStatusDto dto)
        {
            var invoice = _context.Invoices.FirstOrDefault(inv => inv.Id == invoiceId);
            if (invoice == null)
            {
                return NotFound("Invoice not found.");
            }

            var validStatuses = new[] { "Pending", "Verified", "Discrepancy", "Completed", "Voided" };
            if (!validStatuses.Contains(dto.Status))
            {
                return BadRequest($"Invalid status. Must be one of: {string.Join(", ", validStatuses)}");
            }

            var nextStatus = dto.Status.Trim();
            var currentStatus = invoice.Status;

            if (!string.Equals(currentStatus, nextStatus, StringComparison.Ordinal))
            {
                var allowedTransitions = new Dictionary<string, string[]>
                {
                    ["Pending"] = new[] { "Verified", "Discrepancy" },
                    ["Discrepancy"] = new[] { "Verified", "Voided" },
                    ["Verified"] = new[] { "Completed", "Discrepancy" },
                    ["Completed"] = Array.Empty<string>(),
                    ["Voided"] = Array.Empty<string>(),
                };

                if (!allowedTransitions.TryGetValue(currentStatus, out var allowedNext))
                {
                    return BadRequest("Current invoice status is invalid.");
                }

                if (!allowedNext.Contains(nextStatus))
                {
                    return BadRequest($"Invalid status transition: {currentStatus} -> {nextStatus}");
                }
            }

            invoice.Status = nextStatus;
            invoice.UpdatedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Ok(new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.UpdatedAt
            });
        }

        [HttpDelete("{invoiceId:int}")]
        public IActionResult Delete(int invoiceId)
        {
            var invoice = _context.Invoices.FirstOrDefault(inv => inv.Id == invoiceId);
            if (invoice == null)
            {
                return NotFound("Invoice not found.");
            }

            _context.Invoices.Remove(invoice);
            _context.SaveChanges();

            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }
    }

    public class UpdateInvoiceStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
