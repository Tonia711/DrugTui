using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public enum InventoryTransactionType
    {
        StockIn,
        StockOut
    }

    public class InventoryTransaction
    {
        public int Id { get; set; }

        public int MedicationId { get; set; }
        public Medication Medication { get; set; } = null!;

        public InventoryTransactionType Type { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        public int StockBefore { get; set; }
        public int StockAfter { get; set; }

        public int OperatorUserId { get; set; }

        [StringLength(300)]
        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
