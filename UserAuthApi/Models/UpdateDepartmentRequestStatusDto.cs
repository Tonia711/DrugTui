using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class UpdateDepartmentRequestApprovedItemDto
    {
        [Range(1, int.MaxValue)]
        public int ItemId { get; set; }

        [Range(0, int.MaxValue)]
        public int QuantityApproved { get; set; }
    }

    public class UpdateDepartmentRequestStatusDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Notes { get; set; }

        public List<UpdateDepartmentRequestApprovedItemDto>? ApprovedItems { get; set; }
    }
}
