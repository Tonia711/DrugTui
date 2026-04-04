using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "DepartmentMember";

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public string? Bio { get; set; }
    }

}
