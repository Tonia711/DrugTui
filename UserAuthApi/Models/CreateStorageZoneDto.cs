using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class CreateStorageZoneDto
    {
        [Required]
        [StringLength(80)]
        public string Name { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Description { get; set; }

        [Range(0, int.MaxValue)]
        public int Capacity { get; set; }

        [Range(0, int.MaxValue)]
        public int CurrentCapacity { get; set; }

        public decimal TemperatureMin { get; set; }
        public decimal TemperatureMax { get; set; }
        public decimal HumidityMin { get; set; }
        public decimal HumidityMax { get; set; }
    }
}
