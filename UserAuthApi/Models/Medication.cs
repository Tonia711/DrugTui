using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class Medication
    {
        public int Id { get; set; }

        [Required]
        [StringLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(80)]
        public string BatchNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(40)]
        public string Unit { get; set; } = "box";

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; } = 0;

        [Range(0, int.MaxValue)]
        public int ReorderLevel { get; set; } = 10;

        public DateTime? ExpiryDate { get; set; }

        [StringLength(120)]
        public string? Supplier { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<InventoryTransaction> Transactions { get; set; } = new List<InventoryTransaction>();
    }
}
