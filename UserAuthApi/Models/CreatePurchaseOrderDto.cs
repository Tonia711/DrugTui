using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreatePurchaseOrderDto
    {
        [Required]
        [StringLength(40)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(40)]
        public string Status { get; set; } = "Pending Review";

        [Range(1, int.MaxValue)]
        public int SupplierId { get; set; }

        public DateTime? OrderDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
    }
}
