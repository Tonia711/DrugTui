using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        [StringLength(120)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public ICollection<DepartmentRequest> Requests { get; set; } = new List<DepartmentRequest>();
    }
}
