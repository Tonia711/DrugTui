using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class UpdatePurchaseOrderStatusDto
    {
        [Required]
        [StringLength(40)]
        public string Status { get; set; } = string.Empty;

        [StringLength(500)]
        public string? RejectionComment { get; set; }
    }
}