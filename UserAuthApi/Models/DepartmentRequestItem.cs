using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class DepartmentRequestItem
    {
        public int Id { get; set; }

        public int DepartmentRequestId { get; set; }
        public DepartmentRequest DepartmentRequest { get; set; } = null!;

        public int? MedicationId { get; set; }
        public Medication? Medication { get; set; }

        [Required]
        [StringLength(160)]
        public string Description { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int QuantityRequested { get; set; }

        [Range(0, int.MaxValue)]
        public int QuantityApproved { get; set; }
    }
}
