using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class PurchaseOrderItem
    {
        public int Id { get; set; }

        public int PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;

        public int? MedicationId { get; set; }
        public Medication? Medication { get; set; }

        [Required]
        [StringLength(160)]
        public string Description { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int QuantityOrdered { get; set; }

        [Range(0, int.MaxValue)]
        public int QuantityReceived { get; set; }
    }
}
