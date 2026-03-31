using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateDepartmentDto
    {
        [Required]
        [StringLength(120)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }
    }
}
