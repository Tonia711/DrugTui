using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateSupplierDto
    {
        [Required]
        [StringLength(120)]
        public string Name { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(120)]
        public string? Email { get; set; }

        [StringLength(40)]
        public string? Phone { get; set; }

        [StringLength(300)]
        public string? Address { get; set; }
    }
}
