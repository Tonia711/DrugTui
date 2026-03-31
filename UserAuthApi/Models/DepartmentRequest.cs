using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class DepartmentRequest
    {
        public int Id { get; set; }

        [Required]
        [StringLength(40)]
        public string RequestNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending Acceptance";

        public int DepartmentId { get; set; }
        public Department Department { get; set; } = null!;

        public int? RequestedByUserId { get; set; }
        public User? RequestedByUser { get; set; }

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Notes { get; set; }

        public ICollection<DepartmentRequestItem> Items { get; set; } = new List<DepartmentRequestItem>();
    }
}
