using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateDepartmentRequestDto
    {
        [Required]
        [StringLength(40)]
        public string RequestNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending Acceptance";

        [Range(1, int.MaxValue)]
        public int DepartmentId { get; set; }

        public DateTime? RequestedAt { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public List<CreateDepartmentRequestItemDto> Items { get; set; } = new();
    }
}
