using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }
        public Invoice Invoice { get; set; } = null!;

        [Required]
        [StringLength(255)]
        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        [StringLength(50)]
        public string Unit { get; set; } = "Unit";

        public decimal UnitPrice { get; set; }

        public decimal Amount { get; set; } // Quantity * UnitPrice

        // Reference to PurchaseOrderItem (for matching)
        public int? PurchaseOrderItemId { get; set; }
        public PurchaseOrderItem? PurchaseOrderItem { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}
