import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  Check,
  CheckCircle,
  FileText,
  Package,
} from "lucide-react";
import { invoiceApi } from "../util/api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const getDisplayStatus = (status) =>
  status === "Verified" ? "Completed" : status;

const getStatusClassName = (status) => {
  const displayStatus = getDisplayStatus(status);
  if (displayStatus === "Completed") {
    return "bg-green-50 text-green-700 border border-green-200";
  }
  if (displayStatus === "Voided") {
    return "bg-gray-100 text-gray-700 border border-gray-200";
  }
  if (displayStatus === "Pending") {
    return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  }
  if (displayStatus === "Discrepancy") {
    return "bg-red-50 text-red-700 border border-red-200";
  }
  return "bg-gray-50 text-gray-700 border border-gray-200";
};

function InvoiceDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!invoiceId) {
        setIsLoading(false);
        setError("Invoice ID is missing.");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const fromState = location.state?.invoice || null;
        if (fromState && String(fromState.id) === String(invoiceId)) {
          setInvoice(fromState);
        }

        const res = await invoiceApi.getById(invoiceId);
        setInvoice(res.data || null);
      } catch (err) {
        const message =
          typeof err?.response?.data === "string"
            ? err.response.data
            : "Failed to load invoice details.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [invoiceId, location.state]);

  const handleStatusUpdate = async (nextStatus) => {
    if (!invoice?.id) return;

    setActionError("");

    if (invoice.status === "Discrepancy" && nextStatus === "Completed") {
      setActionError("Discrepancy invoice cannot be completed directly.");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await invoiceApi.updateStatus(invoice.id, nextStatus);
      const refreshed = await invoiceApi.getById(invoice.id);
      setInvoice(refreshed.data || null);
    } catch (err) {
      const message =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to update invoice status.";
      setActionError(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const computedTotal = useMemo(() => {
    if (!invoice?.items?.length) {
      return Number(invoice?.totalAmount || 0);
    }

    return invoice.items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  }, [invoice]);

  const normalizedItems = useMemo(() => {
    if (!invoice?.items?.length) return [];

    return invoice.items.map((item, index) => {
      const hasReceivedQuantity =
        item.receivedQuantity !== null && item.receivedQuantity !== undefined;
      const receivedQty = hasReceivedQuantity
        ? Number(item.receivedQuantity)
        : null;
      const invoiceQty = Number(item.quantity ?? 0);
      const amount = Number(item.amount ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const isDiscrepancy = hasReceivedQuantity && receivedQty !== invoiceQty;

      return {
        id: item.id || `item-${index}`,
        name: item.description || "-",
        receivedQuantity: receivedQty,
        invoiceQuantity: invoiceQty,
        unitPrice,
        totalPrice: amount,
        status: isDiscrepancy ? "discrepancy" : "match",
        orderId: invoice.purchaseOrderNumber || "-",
      };
    });
  }, [invoice]);

  const discrepancyCount = useMemo(
    () =>
      normalizedItems.filter((item) => item.status === "discrepancy").length,
    [normalizedItems],
  );

  const orderIds = useMemo(() => {
    if (!normalizedItems.length) {
      return invoice?.purchaseOrderNumber ? [invoice.purchaseOrderNumber] : [];
    }

    const uniqueOrderIds = Array.from(
      new Set(normalizedItems.map((item) => item.orderId)),
    );

    return uniqueOrderIds;
  }, [invoice?.purchaseOrderNumber, normalizedItems]);

  const groupedItems = useMemo(
    () =>
      orderIds.map((orderId) => {
        const orderItems = normalizedItems.filter(
          (item) => item.orderId === orderId,
        );
        const sortedItems = [...orderItems].sort((a, b) => {
          if (a.status === "discrepancy" && b.status === "match") return -1;
          if (a.status === "match" && b.status === "discrepancy") return 1;
          return 0;
        });

        return {
          orderId,
          items: sortedItems,
        };
      }),
    [normalizedItems, orderIds],
  );

  const progressSteps = useMemo(() => {
    if (!invoice) {
      return [];
    }

    const status = invoice.status;
    const hasReviewed =
      status === "Discrepancy" ||
      status === "Verified" ||
      status === "Completed";
    const hasCompleted = status === "Verified" || status === "Completed";

    const makeState = (finished, inProgress) => {
      if (finished) return "finished";
      if (inProgress) return "in-progress";
      return "waiting";
    };

    return [
      {
        id: "uploaded",
        label: "Received",
        status: "finished",
        person: invoice.receivedBy || "John Smith",
        time: formatDateTime(invoice.invoiceDate),
      },
      {
        id: "reviewed",
        label: "Pending Review",
        status: makeState(hasReviewed, status === "Pending"),
      },
      {
        id: "completed",
        label: "Completed",
        status: makeState(hasCompleted, hasReviewed && !hasCompleted),
      },
    ];
  }, [invoice]);

  const progressPercentage = useMemo(() => {
    if (!progressSteps.length) return 0;
    const inProgressIndex = progressSteps.findIndex(
      (step) => step.status === "in-progress",
    );
    const finishedCount = progressSteps.filter(
      (step) => step.status === "finished",
    ).length;
    const targetStepIndex =
      inProgressIndex >= 0 ? inProgressIndex : finishedCount - 1;
    const raw =
      progressSteps.length > 1
        ? (targetStepIndex / (progressSteps.length - 1)) * 100
        : 0;
    return Math.max(0, Math.min(100, raw));
  }, [progressSteps]);

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          type="button"
          onClick={() => navigate("/procurement/invoice")}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <FileText size={14} />
        <span>Invoice / Invoice Details</span>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Loading invoice details...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-xs text-red-700">
          {error}
        </div>
      ) : !invoice ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Invoice not found.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="relative">
              <div
                className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"
                style={{ left: "20px", right: "20px" }}
              >
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="relative flex justify-between">
                {progressSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex flex-col items-center"
                    style={{ minWidth: "120px" }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 transition-all ${
                        step.status === "finished"
                          ? "bg-blue-500 text-white"
                          : "bg-white border-2 border-gray-300 text-gray-400"
                      }`}
                    >
                      {step.status === "finished" ? (
                        <Check size={20} />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>

                    <p
                      className={`mb-1 text-center text-xs ${step.status === "waiting" ? "text-gray-400" : "text-gray-900"}`}
                    >
                      {step.label}
                    </p>

                    {step.person && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">{step.person}</p>
                        {step.time && (
                          <p className="text-xs text-gray-500">{step.time}</p>
                        )}
                      </div>
                    )}

                    {step.status === "in-progress" && !step.person && (
                      <p className="text-xs text-gray-500">In Progress</p>
                    )}

                    {step.status === "waiting" && !step.person && (
                      <p className="text-xs text-gray-400">Waiting</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-gray-900 mb-2">{invoice.invoiceNumber}</h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded text-xs ${getStatusClassName(invoice.status)}`}
                  >
                    {getDisplayStatus(invoice.status)}
                  </span>
                  {discrepancyCount > 0 && (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {discrepancyCount} item{discrepancyCount > 1 ? "s" : ""}{" "}
                      with discrepancy
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {invoice.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate("Discrepancy")}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Mark as Discrepancy
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate("Verified")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                    >
                      Verify Invoice
                    </button>
                  </>
                )}
                {invoice.status === "Discrepancy" && (
                  <>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate("Verified")}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Resolve as Verified
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate("Voided")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                    >
                      Void Invoice
                    </button>
                  </>
                )}
              </div>
            </div>

            {actionError && (
              <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {actionError}
              </div>
            )}

            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <Building size={12} />
                  Supplier
                </div>
                <div className="text-xs text-gray-900">
                  {invoice.supplierName || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <Package size={12} />
                  Order IDs
                </div>
                <div className="text-xs text-gray-900">
                  {orderIds.join(", ") || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <FileText size={12} />
                  PO Number
                </div>
                <div className="text-xs text-gray-900">
                  {invoice.purchaseOrderNumber || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Invoice Date
                </div>
                <div className="text-xs text-gray-900">
                  {formatDateTime(invoice.invoiceDate).split(" ")[0]}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Due Date
                </div>
                <div className="text-xs text-gray-900">-</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm text-gray-900">Invoice Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                      Item Name
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                      Received Qty
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                      Invoice Qty
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                      Unit Price
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                      Total Price
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!groupedItems.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-6 text-xs text-gray-500"
                      >
                        No item records.
                      </td>
                    </tr>
                  ) : (
                    groupedItems.map((group) => (
                      <>
                        <tr
                          key={`header-${group.orderId}`}
                          className="bg-gray-100 border-t-2 border-gray-300"
                        >
                          <td
                            className="px-5 py-2 text-xs text-gray-900"
                            colSpan={6}
                          >
                            <span className="flex items-center gap-1.5">
                              <Package size={14} />
                              <strong>Order ID: {group.orderId}</strong>
                            </span>
                          </td>
                        </tr>
                        {group.items.map((item) => (
                          <tr
                            key={item.id}
                            className={
                              item.status === "discrepancy" ? "bg-red-50" : ""
                            }
                          >
                            <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                              {item.name}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                              {item.receivedQuantity ?? "-"}
                            </td>
                            <td className="px-5 py-3 text-xs align-middle">
                              <span
                                className={
                                  item.status === "discrepancy"
                                    ? "text-red-600"
                                    : "text-gray-900"
                                }
                              >
                                {item.invoiceQuantity}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                              ${item.unitPrice.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                              ${item.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 align-middle">
                              {item.status === "match" ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                                  <CheckCircle size={14} />
                                  Match
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                                  <AlertCircle size={14} />
                                  Discrepancy
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-white border border-gray-200 rounded-lg p-6 w-80">
              <h3 className="text-sm text-gray-900 mb-4">Invoice Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    ${computedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">
                      ${computedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InvoiceDetailsPage;
