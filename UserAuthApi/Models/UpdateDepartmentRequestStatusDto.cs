using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class UpdateDepartmentRequestStatusDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}
