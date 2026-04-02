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
    public class MedicinesController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly Dictionary<string, (string Status, string StatusColor)> SampleStatusByBatch = new()
        {
            ["AMX2024001"] = ("In Stock", "bg-green-100 text-green-700"),
            ["INS2024045"] = ("Low stock", "bg-black text-white"),
            ["PAR2024022"] = ("In Stock", "bg-green-100 text-green-700"),
            ["MOR2024008"] = ("Low stock", "bg-black text-white"),
            ["AZI2023166"] = ("Expired", "bg-red-500 text-white"),
            ["MET2024098"] = ("Near Expiry", "bg-yellow-100 text-yellow-800"),
            ["LIS2024112"] = ("In Stock", "bg-green-100 text-green-700"),
            ["OME2024089"] = ("Expired", "bg-red-500 text-white"),
            ["ATO2024134"] = ("Near Expiry", "bg-yellow-100 text-yellow-800"),
            ["AML2024067"] = ("In Stock", "bg-green-100 text-green-700"),
            ["LEV2024091"] = ("Near Expiry", "bg-yellow-100 text-yellow-800"),
            ["GAB2024078"] = ("Expired", "bg-red-500 text-white"),
            ["FEN2024033"] = ("Near Expiry", "bg-yellow-100 text-yellow-800"),
            ["VAC2025012"] = ("In Stock", "bg-green-100 text-green-700"),
            ["EPI2025008"] = ("In Stock", "bg-green-100 text-green-700"),
            ["PRO2024089"] = ("Near Expiry", "bg-yellow-100 text-yellow-800"),
            ["NOR2024156"] = ("In Stock", "bg-green-100 text-green-700"),
            ["FLU2024201"] = ("Expired", "bg-red-500 text-white"),
        };

        public MedicinesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword)
        {
            var query = _context.Medications.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(m =>
                    m.Name.Contains(keyword) ||
                    m.BatchNumber.Contains(keyword) ||
                    (m.Supplier != null && m.Supplier.Contains(keyword)));
            }

            var medicines = query
                .OrderBy(m => m.Name)
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    m.GenericName,
                    m.BatchNumber,
                    m.Unit,
                    m.StockQuantity,
                    m.ReorderLevel,
                    m.ExpiryDate,
                    m.IsExpiredProcessed,
                    m.Supplier,
                    m.Storage,
                    m.Location,
                    m.Notes,
                    m.CreatedAt
                })
                .AsEnumerable()
                .Select(m =>
                {
                    var statusInfo = ResolveStatus(m.BatchNumber, m.ExpiryDate, m.StockQuantity, m.ReorderLevel);
                    return new
                    {
                        m.Id,
                        m.Name,
                        GenericName = string.IsNullOrWhiteSpace(m.GenericName) ? m.Name : m.GenericName,
                        m.BatchNumber,
                        m.Unit,
                        m.StockQuantity,
                        m.ReorderLevel,
                        m.ExpiryDate,
                        m.IsExpiredProcessed,
                        m.Supplier,
                        Storage = string.IsNullOrWhiteSpace(m.Storage) ? "Ambient" : m.Storage,
                        Location = string.IsNullOrWhiteSpace(m.Location) ? "A-0-000" : m.Location,
                        m.Notes,
                        m.CreatedAt,
                        Quantity = $"{m.StockQuantity} {m.Unit}",
                        Status = statusInfo.Status,
                        StatusColor = statusInfo.StatusColor
                    };
                })
                .ToList();

            return Ok(medicines);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var medicine = _context.Medications
                .Include(m => m.Transactions)
                .FirstOrDefault(m => m.Id == id);

            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            var statusInfo = ResolveStatus(
                medicine.BatchNumber,
                medicine.ExpiryDate,
                medicine.StockQuantity,
                medicine.ReorderLevel
            );

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                GenericName = string.IsNullOrWhiteSpace(medicine.GenericName) ? medicine.Name : medicine.GenericName,
                medicine.BatchNumber,
                medicine.Unit,
                medicine.StockQuantity,
                medicine.ReorderLevel,
                medicine.ExpiryDate,
                medicine.IsExpiredProcessed,
                medicine.Supplier,
                Storage = string.IsNullOrWhiteSpace(medicine.Storage) ? "Ambient" : medicine.Storage,
                Location = string.IsNullOrWhiteSpace(medicine.Location) ? "A-0-000" : medicine.Location,
                medicine.Notes,
                medicine.CreatedAt,
                Quantity = $"{medicine.StockQuantity} {medicine.Unit}",
                Status = statusInfo.Status,
                StatusColor = statusInfo.StatusColor,
                RecentTransactions = medicine.Transactions
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(10)
                    .Select(t => new
                    {
                        t.Id,
                        t.Type,
                        t.Quantity,
                        t.StockBefore,
                        t.StockAfter,
                        t.OperatorUserId,
                        t.Note,
                        t.CreatedAt
                    })
            });
        }

        [HttpGet("low-stock")]
        public IActionResult GetLowStock()
        {
            var lowStock = _context.Medications
                .Where(m => m.StockQuantity <= m.ReorderLevel)
                .OrderBy(m => m.StockQuantity)
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    m.BatchNumber,
                    m.StockQuantity,
                    m.ReorderLevel,
                    m.Unit,
                    m.ExpiryDate
                })
                .ToList();

            return Ok(lowStock);
        }

        [HttpPost]
        public IActionResult Create(CreateMedicationDto dto)
        {
            if (_context.Medications.Any(m => m.BatchNumber == dto.BatchNumber))
            {
                return BadRequest("Batch number already exists.");
            }

            var medicine = new Medication
            {
                Name = dto.Name,
                GenericName = string.IsNullOrWhiteSpace(dto.GenericName) ? dto.Name : dto.GenericName,
                BatchNumber = dto.BatchNumber,
                Unit = dto.Unit,
                StockQuantity = dto.InitialStock,
                ReorderLevel = dto.ReorderLevel,
                ExpiryDate = dto.ExpiryDate,
                Supplier = dto.Supplier,
                Storage = string.IsNullOrWhiteSpace(dto.Storage) ? "Ambient" : dto.Storage,
                Location = string.IsNullOrWhiteSpace(dto.Location) ? "Main Shelf" : dto.Location,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Medications.Add(medicine);

            if (dto.InitialStock > 0)
            {
                _context.InventoryTransactions.Add(new InventoryTransaction
                {
                    Medication = medicine,
                    Type = InventoryTransactionType.StockIn,
                    Quantity = dto.InitialStock,
                    StockBefore = 0,
                    StockAfter = dto.InitialStock,
                    OperatorUserId = GetCurrentUserId(),
                    Note = "Initial stock"
                });
            }

            _context.SaveChanges();

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                GenericName = medicine.GenericName ?? medicine.Name,
                medicine.BatchNumber,
                medicine.Unit,
                medicine.StockQuantity,
                medicine.ReorderLevel,
                medicine.ExpiryDate,
                medicine.IsExpiredProcessed,
                medicine.Supplier,
                medicine.Storage,
                medicine.Location,
                medicine.Notes,
                medicine.CreatedAt,
                Quantity = $"{medicine.StockQuantity} {medicine.Unit}",
                Status = medicine.ExpiryDate.HasValue && medicine.ExpiryDate.Value.Date < DateTime.UtcNow.Date
                    ? "Expired"
                    : (medicine.ExpiryDate.HasValue && (medicine.ExpiryDate.Value.Date - DateTime.UtcNow.Date).TotalDays <= 30
                        ? "Near Expiry"
                        : (medicine.StockQuantity <= medicine.ReorderLevel ? "Low stock" : "In Stock")),
                StatusColor = medicine.ExpiryDate.HasValue && medicine.ExpiryDate.Value.Date < DateTime.UtcNow.Date
                    ? "bg-red-500 text-white"
                    : (medicine.ExpiryDate.HasValue && (medicine.ExpiryDate.Value.Date - DateTime.UtcNow.Date).TotalDays <= 30
                        ? "bg-yellow-100 text-yellow-800"
                        : (medicine.StockQuantity <= medicine.ReorderLevel ? "bg-black text-white" : "bg-green-100 text-green-700"))
            });
        }

        [HttpPut("{id:int}")]
        public IActionResult Update(int id, UpdateMedicationDto dto)
        {
            var medicine = _context.Medications.FirstOrDefault(m => m.Id == id);
            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            if (_context.Medications.Any(m => m.BatchNumber == dto.BatchNumber && m.Id != id))
            {
                return BadRequest("Batch number already exists.");
            }

            medicine.Name = dto.Name;
            medicine.GenericName = string.IsNullOrWhiteSpace(dto.GenericName) ? dto.Name : dto.GenericName;
            medicine.BatchNumber = dto.BatchNumber;
            medicine.Unit = dto.Unit;
            medicine.ReorderLevel = dto.ReorderLevel;
            medicine.ExpiryDate = dto.ExpiryDate;
            medicine.Supplier = dto.Supplier;
            medicine.Storage = string.IsNullOrWhiteSpace(dto.Storage) ? medicine.Storage : dto.Storage;
            medicine.Location = string.IsNullOrWhiteSpace(dto.Location) ? medicine.Location : dto.Location;
            medicine.Notes = dto.Notes;

            _context.SaveChanges();

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                GenericName = medicine.GenericName ?? medicine.Name,
                medicine.BatchNumber,
                medicine.Unit,
                medicine.StockQuantity,
                medicine.ReorderLevel,
                medicine.ExpiryDate,
                medicine.IsExpiredProcessed,
                medicine.Supplier,
                medicine.Storage,
                medicine.Location,
                medicine.Notes
            });
        }

        [HttpPost("{id:int}/mark-expired-processed")]
        public IActionResult MarkExpiredProcessed(int id)
        {
            var medicine = _context.Medications.FirstOrDefault(m => m.Id == id);
            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            var statusInfo = ResolveStatus(
                medicine.BatchNumber,
                medicine.ExpiryDate,
                medicine.StockQuantity,
                medicine.ReorderLevel
            );

            if (statusInfo.Status != "Expired")
            {
                return BadRequest("Only expired medications can be marked as processed.");
            }

            if (!medicine.IsExpiredProcessed)
            {
                medicine.IsExpiredProcessed = true;
                _context.SaveChanges();
            }

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                medicine.BatchNumber,
                medicine.IsExpiredProcessed,
                Message = "Expired medication marked as processed."
            });
        }

        [HttpPost("{id:int}/stock-in")]
        public IActionResult StockIn(int id, AdjustStockDto dto)
        {
            var medicine = _context.Medications.FirstOrDefault(m => m.Id == id);
            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            var before = medicine.StockQuantity;
            medicine.StockQuantity += dto.Quantity;

            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                MedicationId = medicine.Id,
                Type = InventoryTransactionType.StockIn,
                Quantity = dto.Quantity,
                StockBefore = before,
                StockAfter = medicine.StockQuantity,
                OperatorUserId = GetCurrentUserId(),
                Note = dto.Note
            });

            _context.SaveChanges();

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                medicine.StockQuantity,
                Message = "Stock-in completed."
            });
        }

        [HttpPost("{id:int}/stock-out")]
        public IActionResult StockOut(int id, AdjustStockDto dto)
        {
            var medicine = _context.Medications.FirstOrDefault(m => m.Id == id);
            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            if (medicine.StockQuantity < dto.Quantity)
            {
                return BadRequest("Insufficient stock.");
            }

            var before = medicine.StockQuantity;
            medicine.StockQuantity -= dto.Quantity;

            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                MedicationId = medicine.Id,
                Type = InventoryTransactionType.StockOut,
                Quantity = dto.Quantity,
                StockBefore = before,
                StockAfter = medicine.StockQuantity,
                OperatorUserId = GetCurrentUserId(),
                Note = dto.Note
            });

            _context.SaveChanges();

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                medicine.StockQuantity,
                Message = "Stock-out completed."
            });
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            var medicine = _context.Medications.FirstOrDefault(m => m.Id == id);
            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            _context.Medications.Remove(medicine);
            _context.SaveChanges();

            return Ok(new { message = "Medication deleted successfully." });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("Token is invalid.");
            }

            return int.Parse(userIdClaim.Value);
        }

        private static (string Status, string StatusColor) ResolveStatus(
            string batchNumber,
            DateTime? expiryDate,
            int stockQuantity,
            int reorderLevel
        )
        {
            if (!string.IsNullOrWhiteSpace(batchNumber) &&
                SampleStatusByBatch.TryGetValue(batchNumber, out var mapped))
            {
                return mapped;
            }

            if (expiryDate.HasValue)
            {
                var daysToExpiry = (expiryDate.Value.Date - DateTime.UtcNow.Date).TotalDays;
                if (daysToExpiry < 0)
                {
                    return ("Expired", "bg-red-500 text-white");
                }

                if (daysToExpiry <= 30)
                {
                    return ("Near Expiry", "bg-yellow-100 text-yellow-800");
                }
            }

            if (stockQuantity <= reorderLevel)
            {
                return ("Low stock", "bg-black text-white");
            }

            return ("In Stock", "bg-green-100 text-green-700");
        }
    }
}
