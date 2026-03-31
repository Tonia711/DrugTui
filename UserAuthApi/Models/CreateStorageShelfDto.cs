using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateStorageShelfDto
    {
        [Range(1, int.MaxValue)]
        public int StorageZoneId { get; set; }

        [Required]
        [StringLength(40)]
        public string Code { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
