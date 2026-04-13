using System.ComponentModel.DataAnnotations;

namespace UserAuthApi.Models
{
    public class InvoiceExtractionResultDto
    {
        [Required]
        public string FileName { get; set; } = string.Empty;

        public string? InvoiceNumber { get; set; }

        public string? SupplierName { get; set; }

        public string? PurchaseOrderNumber { get; set; }

        public decimal? TotalAmount { get; set; }

        public List<string> SerialNumbers { get; set; } = new();

        public string? PdfText { get; set; }

        public string Confidence { get; set; } = "low";

        public bool OcrUsed { get; set; }

        public string? Error { get; set; }
    }
}