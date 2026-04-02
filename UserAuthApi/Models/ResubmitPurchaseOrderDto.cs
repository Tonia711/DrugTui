using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class ResubmitPurchaseOrderDto
    {
        [Range(1, int.MaxValue)]
        public int? SupplierId { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [MinLength(1)]
        public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
    }
}
