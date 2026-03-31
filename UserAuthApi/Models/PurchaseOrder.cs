using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class PurchaseOrder
    {
        public int Id { get; set; }

        [Required]
        [StringLength(40)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(40)]
        public string Status { get; set; } = "Pending Review";

        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public int? CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Notes { get; set; }

        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    }
}
