using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class StorageZone
    {
        public int Id { get; set; }

        [Required]
        [StringLength(80)]
        public string Name { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Description { get; set; }

        public int Capacity { get; set; } = 0;
        public int CurrentCapacity { get; set; } = 0;

        public decimal TemperatureMin { get; set; }
        public decimal TemperatureMax { get; set; }
        public decimal HumidityMin { get; set; }
        public decimal HumidityMax { get; set; }

        public ICollection<StorageShelf> Shelves { get; set; } = new List<StorageShelf>();
    }
}
