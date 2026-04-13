using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using UserAuthApi.Data;
using UserAuthApi.Models;
using UglyToad.PdfPig;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvoicesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("extract")]
        [RequestSizeLimit(25_000_000)]
        public async Task<IActionResult> Extract([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Invoice file is required.");
            }

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
            var isPdf = file.ContentType.Contains("pdf", StringComparison.OrdinalIgnoreCase)
                || extension == ".pdf";
            var isImage = file.ContentType.Contains("image", StringComparison.OrdinalIgnoreCase)
                || extension is ".jpg" or ".jpeg" or ".png";

            if (!isPdf && !isImage)
            {
                return BadRequest("Only PDF/JPG/PNG files are supported.");
            }

            var tempPath = Path.Combine(Path.GetTempPath(), $"invoice-{Guid.NewGuid():N}.pdf");

            try
            {
                await using (var stream = System.IO.File.Create(tempPath))
                {
                    await file.CopyToAsync(stream);
                }

                var pdfText = isPdf ? NormalizePdfText(ExtractTextFromPdf(tempPath)) : string.Empty;
                var ocrUsed = false;
                string? ocrWarning = null;

                if (isImage || NeedsOcr(pdfText))
                {
                    var ocrText = await TryExtractTextWithAzureOcrAsync(tempPath, file.ContentType, isPdf);
                    if (!string.IsNullOrWhiteSpace(ocrText))
                    {
                        pdfText = NormalizePdfText(ocrText);
                        ocrUsed = true;
                    }
                    else if (isImage)
                    {
                        ocrWarning = "Image OCR is not configured. Set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY.";
                    }
                }

                var invoiceNumber = TryExtractInvoiceNumber(pdfText);
                var supplierName = TryExtractSupplierName(pdfText);
                var purchaseOrderNumber = TryExtractPurchaseOrderNumber(pdfText);
                var totalAmount = TryExtractTotalAmount(pdfText);
                var serialNumbers = ExtractSerialNumbers(pdfText);

                var confidence = GetConfidence(invoiceNumber, supplierName, serialNumbers);

                return Ok(new InvoiceExtractionResultDto
                {
                    FileName = file.FileName,
                    InvoiceNumber = invoiceNumber,
                    SupplierName = supplierName,
                    PurchaseOrderNumber = purchaseOrderNumber,
                    TotalAmount = totalAmount,
                    SerialNumbers = serialNumbers,
                    PdfText = pdfText,
                    Confidence = confidence,
                    OcrUsed = ocrUsed,
                    Error = ocrWarning,
                });
            }
            catch (Exception ex)
            {
                return Ok(new InvoiceExtractionResultDto
                {
                    FileName = file.FileName,
                    Error = $"Failed to extract invoice text: {ex.Message}",
                    Confidence = "low",
                    OcrUsed = false,
                });
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                {
                    System.IO.File.Delete(tempPath);
                }
            }
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? keyword, [FromQuery] string? status)
        {
            var query = _context.Invoices.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(inv =>
                    inv.InvoiceNumber.Contains(keyword) ||
                    (inv.Supplier != null && inv.Supplier.Name.Contains(keyword)) ||
                    (inv.PurchaseOrder != null && inv.PurchaseOrder.OrderNumber.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                status = status.Trim();
                query = query.Where(inv => inv.Status == status);
            }

            var invoices = query
                .OrderByDescending(inv => inv.InvoiceDate)
                .Select(inv => new
                {
                    inv.Id,
                    inv.InvoiceNumber,
                    inv.Status,
                    inv.SupplierId,
                    SupplierName = inv.Supplier != null ? inv.Supplier.Name : string.Empty,
                    PurchaseOrderNumber = inv.PurchaseOrder != null ? inv.PurchaseOrder.OrderNumber : string.Empty,
                    inv.TotalAmount,
                    inv.InvoiceDate,
                    inv.CreatedAt,
                    inv.Notes,
                    ItemCount = inv.Items.Count
                })
                .ToList();

            return Ok(invoices);
        }

        [HttpGet("{invoiceId:int}")]
        public IActionResult GetById(int invoiceId)
        {
            var invoice = _context.Invoices
                .Where(inv => inv.Id == invoiceId)
                .Select(inv => new
                {
                    inv.Id,
                    inv.InvoiceNumber,
                    inv.Status,
                    inv.PurchaseOrderId,
                    PurchaseOrderNumber = inv.PurchaseOrder != null ? inv.PurchaseOrder.OrderNumber : string.Empty,
                    inv.SupplierId,
                    SupplierName = inv.Supplier != null ? inv.Supplier.Name : string.Empty,
                    inv.TotalAmount,
                    inv.InvoiceDate,
                    inv.CreatedAt,
                    inv.UpdatedAt,
                    inv.Notes,
                    Items = inv.Items
                        .OrderBy(i => i.Id)
                        .Select(i => new
                        {
                            i.Id,
                            i.Description,
                            i.Quantity,
                            ReceivedQuantity = i.PurchaseOrderItem != null
                                ? i.PurchaseOrderItem.QuantityReceived
                                : (inv.PurchaseOrder != null
                                    ? inv.PurchaseOrder.Items
                                        .Where(poItem => poItem.Description == i.Description)
                                        .Select(poItem => (int?)poItem.QuantityReceived)
                                        .FirstOrDefault()
                                    : (int?)null),
                            PoQuantity = i.PurchaseOrderItem != null
                                ? i.PurchaseOrderItem.QuantityOrdered
                                : (inv.PurchaseOrder != null
                                    ? inv.PurchaseOrder.Items
                                        .Where(poItem => poItem.Description == i.Description)
                                        .Select(poItem => (int?)poItem.QuantityOrdered)
                                        .FirstOrDefault()
                                    : (int?)null),
                            i.Unit,
                            i.UnitPrice,
                            i.Amount,
                            i.PurchaseOrderItemId,
                            i.Notes
                        })
                        .ToList()
                })
                .FirstOrDefault();

            if (invoice == null)
            {
                return NotFound("Invoice not found.");
            }

            return Ok(invoice);
        }

        [HttpPost]
        public IActionResult Create(CreateInvoiceDto dto)
        {
            var invoiceNumber = dto.InvoiceNumber.Trim();
            if (_context.Invoices.Any(inv => inv.InvoiceNumber == invoiceNumber))
            {
                return BadRequest("Invoice number already exists.");
            }

            var purchaseOrder = _context.PurchaseOrders.FirstOrDefault(po => po.Id == dto.PurchaseOrderId);
            if (purchaseOrder == null)
            {
                return BadRequest("Purchase order does not exist.");
            }

            var supplier = _context.Suppliers.FirstOrDefault(s => s.Id == dto.SupplierId);
            if (supplier == null)
            {
                return BadRequest("Supplier does not exist.");
            }

            var invoice = new Invoice
            {
                InvoiceNumber = invoiceNumber,
                PurchaseOrderId = dto.PurchaseOrderId,
                SupplierId = dto.SupplierId,
                Status = "Pending",
                TotalAmount = dto.TotalAmount,
                InvoiceDate = dto.InvoiceDate ?? DateTime.UtcNow,
                Notes = dto.Notes,
                Items = (dto.Items ?? new List<CreateInvoiceItemDto>()).Select(itemDto => new InvoiceItem
                {
                    Description = itemDto.Description.Trim(),
                    Quantity = itemDto.Quantity,
                    Unit = itemDto.Unit,
                    UnitPrice = itemDto.UnitPrice,
                    Amount = itemDto.Amount,
                    PurchaseOrderItemId = itemDto.PurchaseOrderItemId,
                    Notes = itemDto.Notes
                }).ToList()
            };

            _context.Invoices.Add(invoice);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetById), new { invoiceId = invoice.Id }, new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status
            });
        }

        [HttpPut("{invoiceId:int}/status")]
        public IActionResult UpdateStatus(int invoiceId, [FromBody] UpdateInvoiceStatusDto dto)
        {
            var invoice = _context.Invoices.FirstOrDefault(inv => inv.Id == invoiceId);
            if (invoice == null)
            {
                return NotFound("Invoice not found.");
            }

            var validStatuses = new[] { "Pending", "Verified", "Discrepancy", "Completed", "Voided" };
            if (!validStatuses.Contains(dto.Status))
            {
                return BadRequest($"Invalid status. Must be one of: {string.Join(", ", validStatuses)}");
            }

            var nextStatus = dto.Status.Trim();
            var currentStatus = invoice.Status;

            if (!string.Equals(currentStatus, nextStatus, StringComparison.Ordinal))
            {
                var allowedTransitions = new Dictionary<string, string[]>
                {
                    ["Pending"] = new[] { "Verified", "Discrepancy" },
                    ["Discrepancy"] = new[] { "Verified", "Voided" },
                    ["Verified"] = new[] { "Completed", "Discrepancy" },
                    ["Completed"] = Array.Empty<string>(),
                    ["Voided"] = Array.Empty<string>(),
                };

                if (!allowedTransitions.TryGetValue(currentStatus, out var allowedNext))
                {
                    return BadRequest("Current invoice status is invalid.");
                }

                if (!allowedNext.Contains(nextStatus))
                {
                    return BadRequest($"Invalid status transition: {currentStatus} -> {nextStatus}");
                }
            }

            invoice.Status = nextStatus;
            invoice.UpdatedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Ok(new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.UpdatedAt
            });
        }

        [HttpDelete("{invoiceId:int}")]
        public IActionResult Delete(int invoiceId)
        {
            var invoice = _context.Invoices.FirstOrDefault(inv => inv.Id == invoiceId);
            if (invoice == null)
            {
                return NotFound("Invoice not found.");
            }

            _context.Invoices.Remove(invoice);
            _context.SaveChanges();

            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
        }

        private string ExtractTextFromPdf(string pdfPath)
        {
            var builder = new StringBuilder();

            using var document = PdfDocument.Open(pdfPath);
            foreach (var page in document.GetPages())
            {
                var text = page.Text;
                if (!string.IsNullOrWhiteSpace(text))
                {
                    builder.AppendLine(text);
                }
            }

            return builder.ToString().Trim();
        }

        private static bool NeedsOcr(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return true;
            }

            var lineCount = text.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length;
            if (lineCount <= 2 || text.Length < 80)
            {
                return true;
            }

            var alphaNumericCount = text.Count(char.IsLetterOrDigit);
            return alphaNumericCount < 40;
        }

        private async Task<string?> TryExtractTextWithAzureOcrAsync(string filePath, string contentType, bool isPdf)
        {
            var endpoint = Environment.GetEnvironmentVariable("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT");
            var apiKey = Environment.GetEnvironmentVariable("AZURE_DOCUMENT_INTELLIGENCE_KEY");

            if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey))
            {
                return null;
            }

            var baseUri = endpoint.TrimEnd('/');
            var analyzeUrl = $"{baseUri}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30";
            var mediaType = !string.IsNullOrWhiteSpace(contentType)
                ? contentType
                : (isPdf ? "application/pdf" : "application/octet-stream");

            using var httpClient = new HttpClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, analyzeUrl);
            request.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);
            request.Content = new ByteArrayContent(await System.IO.File.ReadAllBytesAsync(filePath));
            request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mediaType);

            using var analyzeResponse = await httpClient.SendAsync(request);
            if (!analyzeResponse.IsSuccessStatusCode)
            {
                return null;
            }

            if (!analyzeResponse.Headers.TryGetValues("operation-location", out var values))
            {
                return null;
            }

            var operationUrl = values.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(operationUrl))
            {
                return null;
            }

            for (var attempt = 0; attempt < 20; attempt++)
            {
                await Task.Delay(500);

                using var pollRequest = new HttpRequestMessage(HttpMethod.Get, operationUrl);
                pollRequest.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);
                using var pollResponse = await httpClient.SendAsync(pollRequest);
                if (!pollResponse.IsSuccessStatusCode)
                {
                    continue;
                }

                var body = await pollResponse.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(body))
                {
                    continue;
                }

                using var doc = JsonDocument.Parse(body);
                if (!doc.RootElement.TryGetProperty("status", out var statusElement))
                {
                    continue;
                }

                var status = statusElement.GetString();
                if (string.Equals(status, "failed", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (!string.Equals(status, "succeeded", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!doc.RootElement.TryGetProperty("analyzeResult", out var analyzeResult))
                {
                    return null;
                }

                if (analyzeResult.TryGetProperty("content", out var contentElement))
                {
                    var content = contentElement.GetString();
                    if (!string.IsNullOrWhiteSpace(content))
                    {
                        return content;
                    }
                }

                return null;
            }

            return null;
        }

        private static string NormalizePdfText(string pdfText)
        {
            if (string.IsNullOrWhiteSpace(pdfText))
            {
                return string.Empty;
            }

            var normalized = pdfText
                .Replace("\r\n", "\n")
                .Replace('\r', '\n');

            normalized = Regex.Replace(normalized, @"-\s*\n\s*", string.Empty);
            normalized = Regex.Replace(normalized, @"[ \t]+", " ");
            normalized = Regex.Replace(normalized, @"\n{3,}", "\n\n");

            return normalized.Trim();
        }

        private static List<string> GetNonEmptyLines(string pdfText)
        {
            return pdfText
                .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .ToList();
        }

        private static string? CleanFieldValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var cleaned = Regex.Replace(value, @"\s{2,}", " ").Trim();
            cleaned = cleaned.Trim(':', '-', '–', '—', '.', ',', ';', ' ');
            return string.IsNullOrWhiteSpace(cleaned) ? null : cleaned;
        }

        private static string? StripTrailingNoiseWords(string candidate)
        {
            if (string.IsNullOrWhiteSpace(candidate))
            {
                return null;
            }

            var noiseWords = new[]
            {
                "ORDER",
                "DATE",
                "TOTAL",
                "AMOUNT",
                "SUPPLIER",
                "VENDOR",
                "INVOICE",
                "BILLING",
                "SUBTOTAL",
                "SUBSCRIPTION",
            };

            var result = candidate.Trim();
            while (true)
            {
                var removed = false;
                foreach (var word in noiseWords)
                {
                    if (result.EndsWith(word, StringComparison.OrdinalIgnoreCase) && result.Length > word.Length + 2)
                    {
                        result = result[..^word.Length].Trim();
                        removed = true;
                        break;
                    }
                }

                if (!removed)
                {
                    break;
                }
            }

            return string.IsNullOrWhiteSpace(result) ? null : result;
        }

        private static bool IsLikelySerialCandidate(string candidate)
        {
            if (string.IsNullOrWhiteSpace(candidate))
            {
                return false;
            }

            candidate = candidate.Trim();
            if (candidate.Length < 6)
            {
                return false;
            }

            if (!candidate.Any(char.IsDigit) || !candidate.Any(char.IsLetter))
            {
                return false;
            }

            var upper = candidate.ToUpperInvariant();
            var noiseWords = new[]
            {
                "INVOICE",
                "TOTAL",
                "SUBTOTAL",
                "AMOUNT",
                "ORDER",
                "DATE",
                "SUPPLIER",
                "VENDOR",
                "BILLING",
                "SUBSCRIPTION",
                "HOTSHOT",
                "QUANTITY",
                "QTY",
            };

            if (noiseWords.Any(upper.Contains))
            {
                return false;
            }

            var digitCount = candidate.Count(char.IsDigit);
            if (digitCount < 2)
            {
                return false;
            }

            return true;
        }

        private static decimal? TryParseAmount(string text)
        {
            var normalized = text.Replace(",", string.Empty).Trim();
            return decimal.TryParse(
                normalized,
                NumberStyles.AllowDecimalPoint | NumberStyles.AllowLeadingSign,
                CultureInfo.InvariantCulture,
                out var amount)
                ? amount
                : null;
        }

        private static string? ExtractValueFromLabelLine(IEnumerable<string> lines, params string[] labelPatterns)
        {
            var lineList = lines.ToList();
            for (var index = 0; index < lineList.Count; index++)
            {
                var line = lineList[index];
                if (!labelPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase)))
                {
                    continue;
                }

                var inlineValue = Regex.Replace(
                    line,
                    $"(?i)^.*?(?:{string.Join("|", labelPatterns)})\\s*[:\\-]?\\s*",
                    string.Empty);
                inlineValue = CleanFieldValue(inlineValue);
                if (!string.IsNullOrWhiteSpace(inlineValue))
                {
                    return inlineValue;
                }

                for (var offset = 1; offset <= 2 && index + offset < lineList.Count; offset++)
                {
                    var candidate = CleanFieldValue(lineList[index + offset]);
                    if (!string.IsNullOrWhiteSpace(candidate))
                    {
                        return candidate;
                    }
                }
            }

            return null;
        }

        private string? TryExtractInvoiceNumber(string pdfText)
        {
            if (string.IsNullOrWhiteSpace(pdfText))
            {
                return null;
            }

            var lines = GetNonEmptyLines(pdfText);
            var patterns = new[]
            {
                @"(?i)\binvoice\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})",
                @"(?i)\binv\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})",
                @"(?i)\binvoice\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})"
            };

            foreach (var line in lines)
            {
                foreach (var pattern in patterns)
                {
                    var match = Regex.Match(line, pattern);
                    if (match.Success)
                    {
                        var candidate = CleanFieldValue(match.Groups[1].Value);
                        candidate = candidate is null ? null : StripTrailingNoiseWords(candidate);
                        if (!string.IsNullOrWhiteSpace(candidate))
                        {
                            return candidate;
                        }
                    }
                }
            }

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(pdfText, pattern);
                if (match.Success)
                {
                    var candidate = CleanFieldValue(match.Groups[1].Value);
                    candidate = candidate is null ? null : StripTrailingNoiseWords(candidate);
                    if (!string.IsNullOrWhiteSpace(candidate))
                    {
                        return candidate;
                    }
                }
            }

            var fallbackMatch = Regex.Match(pdfText, @"\bINV[-A-Z0-9/]{4,}\b", RegexOptions.IgnoreCase);
            if (!fallbackMatch.Success)
            {
                return null;
            }

            var fallback = CleanFieldValue(fallbackMatch.Value);
            fallback = fallback is null ? null : StripTrailingNoiseWords(fallback);
            return string.IsNullOrWhiteSpace(fallback) ? null : fallback;
        }

        private string? TryExtractSupplierName(string pdfText)
        {
            if (string.IsNullOrWhiteSpace(pdfText))
            {
                return null;
            }

            var lines = GetNonEmptyLines(pdfText);
            var supplierNames = _context.Suppliers
                .Select(s => s.Name)
                .OrderByDescending(name => name.Length)
                .ToList();

            foreach (var supplierName in supplierNames)
            {
                if (lines.Any(line => line.Contains(supplierName, StringComparison.OrdinalIgnoreCase)))
                {
                    return supplierName;
                }
            }

            var labelPatterns = new[]
            {
                @"\bsupplier\b",
                @"\bfrom\b",
                @"\bvendor\b",
                @"\bbill\s*from\b",
                @"\bsold\s*by\b"
            };

            foreach (var line in lines)
            {
                if (!labelPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase)))
                {
                    continue;
                }

                var inlineValue = Regex.Replace(
                    line,
                    @"(?i)^.*?(?:supplier|from|vendor|bill\s*from|sold\s*by)\s*[:\-]?\s*",
                    string.Empty);
                inlineValue = CleanFieldValue(inlineValue);
                if (!string.IsNullOrWhiteSpace(inlineValue))
                {
                    return inlineValue;
                }

                var nextLineIndex = lines.IndexOf(line) + 1;
                if (nextLineIndex < lines.Count)
                {
                    var nextLine = CleanFieldValue(lines[nextLineIndex]);
                    if (!string.IsNullOrWhiteSpace(nextLine))
                    {
                        return nextLine;
                    }
                }
            }

            return null;
        }

        private List<string> ExtractSerialNumbers(string pdfText)
        {
            if (string.IsNullOrWhiteSpace(pdfText))
            {
                return new List<string>();
            }

            var lines = GetNonEmptyLines(pdfText);
            var serialNumbers = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            void AddCandidate(string? rawCandidate)
            {
                var candidate = CleanFieldValue(rawCandidate);
                candidate = candidate is null ? null : StripTrailingNoiseWords(candidate);

                if (string.IsNullOrWhiteSpace(candidate))
                {
                    return;
                }

                candidate = Regex.Replace(candidate, @"[\s,;]+", string.Empty);
                candidate = candidate.Trim().Trim('.', ':', '-', '–', '—');

                if (!IsLikelySerialCandidate(candidate))
                {
                    return;
                }

                if (seen.Add(candidate))
                {
                    serialNumbers.Add(candidate);
                }
            }

            var labelPatterns = new[]
            {
                @"\bserial\s*(?:no\.?|number|#)?\b",
                @"\bs\/n\b",
                @"\bsn\b",
                @"\blot\s*(?:no\.?|number|#)?\b",
                @"\bbatch\s*(?:no\.?|number|#)?\b",
                @"\bimei\s*(?:no\.?|number|#)?\b",
                @"\bitem\s*(?:no\.?|number|#)?\b",
                @"\bmodel\s*(?:no\.?|number|#)?\b",
            };

            for (var index = 0; index < lines.Count; index++)
            {
                var line = lines[index];
                if (!labelPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase)))
                {
                    continue;
                }

                var inlineCandidate = Regex.Replace(
                    line,
                    @"(?i)^.*?(?:serial\s*(?:no\.?|number|#)?|s\/n|sn|lot\s*(?:no\.?|number|#)?|batch\s*(?:no\.?|number|#)?|imei\s*(?:no\.?|number|#)?|item\s*(?:no\.?|number|#)?|model\s*(?:no\.?|number|#)?)\s*[:\-]?\s*",
                    string.Empty);
                foreach (Match match in Regex.Matches(inlineCandidate, @"\b[A-Z0-9][A-Z0-9\-/]{5,}\b", RegexOptions.IgnoreCase))
                {
                    AddCandidate(match.Value);
                }

                for (var offset = 1; offset <= 2 && index + offset < lines.Count; offset++)
                {
                    foreach (Match match in Regex.Matches(lines[index + offset], @"\b[A-Z0-9][A-Z0-9\-/]{5,}\b", RegexOptions.IgnoreCase))
                    {
                        AddCandidate(match.Value);
                    }
                }
            }

            if (serialNumbers.Count == 0)
            {
                foreach (Match match in Regex.Matches(pdfText, @"\b[A-Z0-9][A-Z0-9\-/]{7,}\b", RegexOptions.IgnoreCase))
                {
                    AddCandidate(match.Value);
                }
            }

            return serialNumbers.Take(10).ToList();
        }

        private string? TryExtractPurchaseOrderNumber(string pdfText)
        {
            if (string.IsNullOrWhiteSpace(pdfText))
            {
                return null;
            }

            var lines = GetNonEmptyLines(pdfText);
            var patterns = new[]
            {
                @"(?i)\bpurchase\s*order\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{2,})",
                @"(?i)\bpo\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{2,})",
            };

            foreach (var line in lines)
            {
                foreach (var pattern in patterns)
                {
                    var match = Regex.Match(line, pattern);
                    if (match.Success)
                    {
                        var candidate = CleanFieldValue(match.Groups[1].Value);
                        candidate = candidate is null ? null : StripTrailingNoiseWords(candidate);
                        if (!string.IsNullOrWhiteSpace(candidate))
                        {
                            return candidate;
                        }
                    }
                }
            }

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(pdfText, pattern);
                if (match.Success)
                {
                    var candidate = CleanFieldValue(match.Groups[1].Value);
                    candidate = candidate is null ? null : StripTrailingNoiseWords(candidate);
                    if (!string.IsNullOrWhiteSpace(candidate))
                    {
                        return candidate;
                    }
                }
            }

            var fallbackMatch = Regex.Match(pdfText, @"\bPO[-A-Z0-9/]{3,}\b", RegexOptions.IgnoreCase);
            if (!fallbackMatch.Success)
            {
                return null;
            }

            var fallback = CleanFieldValue(fallbackMatch.Value);
            fallback = fallback is null ? null : StripTrailingNoiseWords(fallback);
            return string.IsNullOrWhiteSpace(fallback) ? null : fallback;
        }

        private decimal? TryExtractTotalAmount(string pdfText)
        {
            if (string.IsNullOrWhiteSpace(pdfText))
            {
                return null;
            }

            var lines = GetNonEmptyLines(pdfText);
            var labelPatterns = new[]
            {
                @"\bgrand\s+total\b",
                @"\binvoice\s+total\b",
                @"\bamount\s+due\b",
                @"\bbalance\s+due\b",
                @"\btotal\s*amount\b",
                @"\btotal\b",
            };

            foreach (var line in lines)
            {
                if (!labelPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase)))
                {
                    continue;
                }

                var amount = ExtractAmountFromText(line);
                if (amount.HasValue)
                {
                    return amount;
                }
            }

            return ExtractAmountFromText(pdfText);
        }

        private static decimal? ExtractAmountFromText(string text)
        {
            var matches = Regex.Matches(
                text,
                @"(?:\$|USD\s*)?([0-9][0-9,]*(?:\.[0-9]{2})?)",
                RegexOptions.IgnoreCase);

            if (matches.Count == 0)
            {
                return null;
            }

            // Prefer the last amount on the line because invoice totals are usually right-aligned.
            for (var index = matches.Count - 1; index >= 0; index--)
            {
                var amount = TryParseAmount(matches[index].Groups[1].Value);
                if (amount.HasValue)
                {
                    return amount;
                }
            }

            return null;
        }

        private static string GetConfidence(string? invoiceNumber, string? supplierName, List<string> serialNumbers)
        {
            var score = 0;
            if (!string.IsNullOrWhiteSpace(invoiceNumber)) score++;
            if (!string.IsNullOrWhiteSpace(supplierName)) score++;
            if (serialNumbers.Count > 0) score++;

            return score switch
            {
                3 => "high",
                2 => "medium",
                _ => "low",
            };
        }
    }

    public class UpdateInvoiceStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
