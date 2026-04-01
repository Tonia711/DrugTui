using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        [Required]
        [StringLength(40)]
        public string InvoiceNumber { get; set; } = string.Empty;

        // Foreign key to PurchaseOrder
        public int PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        [Required]
        [StringLength(40)]
        public string Status { get; set; } = "Pending"; // Pending, Verified, Discrepancy, Completed

        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public decimal TotalAmount { get; set; }

        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    }
}
