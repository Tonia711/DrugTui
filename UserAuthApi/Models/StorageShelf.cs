using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class StorageShelf
    {
        public int Id { get; set; }

        public int StorageZoneId { get; set; }
        public StorageZone StorageZone { get; set; } = null!;

        [Required]
        [StringLength(40)]
        public string Code { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
