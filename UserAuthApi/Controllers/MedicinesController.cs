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
                    m.BatchNumber,
                    m.Unit,
                    m.StockQuantity,
                    m.ReorderLevel,
                    m.ExpiryDate,
                    m.Supplier,
                    m.Notes,
                    m.CreatedAt,
                    IsLowStock = m.StockQuantity <= m.ReorderLevel
                })
                .ToList();

            return Ok(medicines);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var medicine = _context.Medications
                .Where(m => m.Id == id)
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    m.BatchNumber,
                    m.Unit,
                    m.StockQuantity,
                    m.ReorderLevel,
                    m.ExpiryDate,
                    m.Supplier,
                    m.Notes,
                    m.CreatedAt,
                    IsLowStock = m.StockQuantity <= m.ReorderLevel,
                    RecentTransactions = m.Transactions
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
                })
                .FirstOrDefault();

            if (medicine == null)
            {
                return NotFound("Medication not found.");
            }

            return Ok(medicine);
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
                BatchNumber = dto.BatchNumber,
                Unit = dto.Unit,
                StockQuantity = dto.InitialStock,
                ReorderLevel = dto.ReorderLevel,
                ExpiryDate = dto.ExpiryDate,
                Supplier = dto.Supplier,
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
                medicine.BatchNumber,
                medicine.Unit,
                medicine.StockQuantity,
                medicine.ReorderLevel,
                medicine.ExpiryDate,
                medicine.Supplier,
                medicine.Notes,
                medicine.CreatedAt
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
            medicine.BatchNumber = dto.BatchNumber;
            medicine.Unit = dto.Unit;
            medicine.ReorderLevel = dto.ReorderLevel;
            medicine.ExpiryDate = dto.ExpiryDate;
            medicine.Supplier = dto.Supplier;
            medicine.Notes = dto.Notes;

            _context.SaveChanges();

            return Ok(new
            {
                medicine.Id,
                medicine.Name,
                medicine.BatchNumber,
                medicine.Unit,
                medicine.StockQuantity,
                medicine.ReorderLevel,
                medicine.ExpiryDate,
                medicine.Supplier,
                medicine.Notes
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
    }
}
