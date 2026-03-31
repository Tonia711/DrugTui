using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateDepartmentRequestItemDto
    {
        public int? MedicationId { get; set; }

        [Required]
        [StringLength(160)]
        public string Description { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int QuantityRequested { get; set; }

        [Range(0, int.MaxValue)]
        public int QuantityApproved { get; set; } = 0;
    }
}
