using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreatePurchaseOrderItemDto
    {
        public int? MedicationId { get; set; }

        [Required]
        [StringLength(160)]
        public string Description { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int QuantityOrdered { get; set; }
    }
}
