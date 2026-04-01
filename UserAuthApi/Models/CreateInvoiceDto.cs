using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateInvoiceDto
    {
        [Required]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public int PurchaseOrderId { get; set; }

        [Required]
        public int SupplierId { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime? InvoiceDate { get; set; }

        public string? Notes { get; set; }

        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }

    public class CreateInvoiceItemDto
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public string Unit { get; set; } = "Unit";

        public decimal UnitPrice { get; set; }

        public decimal Amount { get; set; }

        public int? PurchaseOrderItemId { get; set; }

        public string? Notes { get; set; }
    }
}
