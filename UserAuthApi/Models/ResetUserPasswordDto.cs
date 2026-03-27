using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class ResetUserPasswordDto
    {
        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
