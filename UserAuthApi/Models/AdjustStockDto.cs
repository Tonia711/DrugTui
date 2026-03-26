using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class AdjustStockDto
    {
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [StringLength(300)]
        public string? Note { get; set; }
    }
}
