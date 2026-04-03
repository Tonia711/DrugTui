import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle,
  Package,
  Trash2,
  XCircle,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import api, { purchaseOrderApi } from "../util/api";

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

const getStatusClassName = (status) => {
  if (status === "Invoice Matched") {
    return "bg-green-100 text-green-700";
  }
  if (status === "Rejected" || status === "Invoice Mismatched") {
    return "bg-red-100 text-red-700";
  }
  if (status === "Pending Review" || status === "Partially Received") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-blue-100 text-blue-700";
};

function PurchaseOrderDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await api.get("/Users/me");
        setCurrentUser(res.data || null);
      } catch {
        setCurrentUser(null);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setIsLoading(false);
        setError("Order ID is missing.");
        return;
      }

      setIsLoading(true);
      setError("");
      setActionMessage(location.state?.message || "");
      try {
        const fromState = location.state?.order || null;
        if (fromState && fromState.orderNumber === orderId) {
          setOrder(fromState);
        }

        const res = await purchaseOrderApi.getByOrderNumber(orderId);
        setOrder(res.data || null);
      } catch (err) {
        const message =
          typeof err?.response?.data === "string"
            ? err.response.data
            : "Failed to load order details.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [location.state, orderId]);

  const isManager = currentUser?.role === "Admin";
  const isOwner =
    !!currentUser?.id &&
    !!order?.createdByUserId &&
    Number(currentUser.id) === Number(order.createdByUserId);
  const canReview = isManager && order?.status === "Pending Review";
  const canResubmitRejected =
    order?.status === "Rejected" && (isOwner || isManager);

  const refreshOrder = async () => {
    if (!orderId) return;
    const res = await purchaseOrderApi.getByOrderNumber(orderId);
    setOrder(res.data || null);
  };

  const handleApprove = async () => {
    if (!orderId || !canReview) return;

    setError("");
    setActionMessage("");
    try {
      setIsUpdatingStatus(true);
      await purchaseOrderApi.updateStatus(orderId, {
        status: "Approved/Ordered",
      });
      await refreshOrder();
      setActionMessage("Order approved successfully.");
    } catch (err) {
      const message =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to approve order.";
      setError(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!orderId || !canReview) return;
    if (!rejectionComment.trim()) {
      setError("Please enter a rejection comment before rejecting this order.");
      setActionMessage("");
      return;
    }

    setError("");
    setActionMessage("");
    try {
      setIsUpdatingStatus(true);
      await purchaseOrderApi.updateStatus(orderId, {
        status: "Rejected",
        rejectionComment: rejectionComment.trim(),
      });
      await refreshOrder();
      setActionMessage("Order rejected successfully.");
    } catch (err) {
      const message =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to reject order.";
      setError(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderId || !canResubmitRejected) return;
    const confirmed = window.confirm(
      "Delete this rejected order permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    setError("");
    setActionMessage("");
    try {
      setIsUpdatingStatus(true);
      await purchaseOrderApi.delete(orderId);
      navigate("/procurement/purchase-order", {
        replace: true,
        state: { message: "Purchase order deleted successfully." },
      });
    } catch (err) {
      const message =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to delete order.";
      setError(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const progressSteps = useMemo(() => {
    if (!order) {
      return [];
    }

    const status = order.status;
    const isRejected = status === "Rejected";
    const approvedStatuses = [
      "Approved/Ordered",
      "Partially Received",
      "Fully Received",
      "Invoice Matched",
      "Invoice Mismatched",
    ];
    const receivedStatuses = [
      "Partially Received",
      "Fully Received",
      "Invoice Matched",
      "Invoice Mismatched",
    ];
    const completedStatuses = ["Invoice Matched"];
    const completedInProgressStatuses = ["Invoice Mismatched"];

    const approvedFinished = approvedStatuses.includes(status);
    const receivedFinished = receivedStatuses.includes(status);
    const completedFinished = completedStatuses.includes(status);

    const makeState = (finished, inProgress) => {
      if (finished) return "finished";
      if (inProgress) return "in-progress";
      return "waiting";
    };

    return [
      {
        id: "ordered",
        label: "Ordered",
        status: "finished",
        person: order.createdByUsername || "System",
        time: formatDateTime(order.orderDate),
      },
      {
        id: "approved",
        label: isRejected ? "Rejected" : "Approved",
        status: isRejected
          ? "rejected"
          : makeState(approvedFinished, status === "Pending Review"),
      },
      {
        id: "received",
        label: "Received",
        status: makeState(
          receivedFinished,
          approvedFinished && !receivedFinished,
        ),
      },
      {
        id: "completed",
        label: "Completed",
        status: makeState(
          completedFinished,
          completedInProgressStatuses.includes(status),
        ),
      },
    ];
  }, [order]);

  const progressPercentage = useMemo(() => {
    if (!progressSteps.length) return 0;
    const inProgressIndex = progressSteps.findIndex(
      (step) => step.status === "in-progress",
    );
    const finishedCount = progressSteps.filter(
      (step) => step.status === "finished" || step.status === "rejected",
    ).length;
    const targetStepIndex =
      inProgressIndex >= 0 ? inProgressIndex : finishedCount - 1;
    const raw =
      progressSteps.length > 1
        ? (targetStepIndex / (progressSteps.length - 1)) * 100
        : 0;
    return Math.max(0, Math.min(100, raw));
  }, [progressSteps]);

  const orderItems = useMemo(() => {
    if (!order) return [];
    return (order.items || []).map((item) => ({
      name: item.description,
      quantity: item.quantityOrdered,
      unit: item.unit,
      receivedQuantity: item.quantityReceived,
    }));
  }, [order]);

  const orderedItems = useMemo(
    () => orderItems.filter((item) => item.quantity > 0),
    [orderItems],
  );

  const receivedItems = useMemo(
    () =>
      orderItems
        .filter((item) => item.receivedQuantity > 0)
        .map((item) => ({
          name: item.name,
          quantity: item.receivedQuantity,
        })),
    [orderItems],
  );

  const orderComparisons = useMemo(
    () =>
      orderedItems.map((orderedItem) => {
        const receipt = receivedItems.find(
          (item) => item.name === orderedItem.name,
        );

        if (!receipt) {
          return {
            name: orderedItem.name,
            orderedQty: orderedItem.quantity,
            receivedQty: 0,
            status: "not-received",
          };
        }

        if (receipt.quantity < orderedItem.quantity) {
          return {
            name: orderedItem.name,
            orderedQty: orderedItem.quantity,
            receivedQty: receipt.quantity,
            status: "shortage",
          };
        }

        return {
          name: orderedItem.name,
          orderedQty: orderedItem.quantity,
          receivedQty: receipt.quantity,
          status: "match",
        };
      }),
    [orderedItems, receivedItems],
  );

  const extraReceiptItems = useMemo(
    () =>
      receivedItems.filter(
        (receivedItem) =>
          !orderedItems.find(
            (orderedItem) => orderedItem.name === receivedItem.name,
          ),
      ),
    [orderedItems, receivedItems],
  );

  const sortedOrderComparisons = useMemo(() => {
    return [...orderComparisons].sort((a, b) => {
      if (a.status !== "match" && b.status === "match") return -1;
      if (a.status === "match" && b.status !== "match") return 1;
      return 0;
    });
  }, [orderComparisons]);

  const sortedReceiptItems = useMemo(
    () =>
      sortedOrderComparisons.map((comparison) =>
        receivedItems.find((item) => item.name === comparison.name),
      ),
    [receivedItems, sortedOrderComparisons],
  );

  const orderDescription = useMemo(() => {
    if (!orderedItems.length) {
      return order?.notes || `Total ${order?.itemCount || 0} item(s)`;
    }

    const firstItem = orderedItems[0];
    const unitLabel = firstItem.unit || "units";
    return `${firstItem.name} - ${firstItem.quantity} ${unitLabel}`;
  }, [order?.itemCount, order?.notes, orderedItems]);

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          type="button"
          onClick={() => navigate("/procurement/purchase-order")}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <Package size={14} />
        <span>Purchase Order / Order Details</span>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Loading order details...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-xs text-red-700">
          {error}
        </div>
      ) : !order ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Order not found.
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
                          : step.status === "rejected"
                            ? "bg-red-500 text-white"
                            : "bg-white border-2 border-gray-300 text-gray-400"
                      }`}
                    >
                      {step.status === "finished" ? (
                        <Check size={20} />
                      ) : step.status === "rejected" ? (
                        <XCircle size={20} />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>

                    <p
                      className={`mb-1 text-center text-xs ${
                        step.status === "waiting"
                          ? "text-gray-400"
                          : step.status === "rejected"
                            ? "text-red-700"
                            : "text-gray-900"
                      }`}
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

                    {step.status === "rejected" && !step.person && (
                      <p className="text-xs text-red-600">Rejected</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-gray-900 mb-1">Order Details</h1>
            <p className="text-xs text-gray-500">
              View and manage order status and items
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Order ID</p>
                <p className="text-xs text-gray-900">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Description</p>
                <p className="text-xs text-gray-900">{orderDescription}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Supplier</p>
                <p className="text-xs text-gray-900">{order.supplierName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <StatusBadge
                  label={order.status}
                  toneClass={getStatusClassName(order.status)}
                  widthClass="min-w-[140px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Order Items
              </h2>
              <div className="space-y-2">
                {sortedOrderComparisons.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="p-4 rounded-lg border-2 border-gray-200 bg-white min-h-[88px] flex items-center"
                  >
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-xs text-gray-900">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-700">
                        <span>Ordered Qty:</span>
                        <span>{item.orderedQty}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {extraReceiptItems.map((item, index) => (
                  <div
                    key={`placeholder-${item.name}-${index}`}
                    className="p-4 rounded-lg border-2 border-gray-200 bg-white min-h-[88px] flex items-center"
                  >
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 italic">
                          Not in order
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Ordered Qty:</span>
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Received Items
              </h2>
              {!receivedItems.length ? (
                <div className="text-center py-12 text-gray-500">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs">No receipt available yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedReceiptItems.map((item, index) => {
                    const comparison = sortedOrderComparisons[index];

                    if (!item) {
                      return (
                        <div
                          key={`not-received-${comparison.name}-${index}`}
                          className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 transition-colors min-h-[88px] flex items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-xs text-gray-500">
                                  {comparison.name}
                                </span>
                                <span className="text-xs text-gray-600">
                                  Not received
                                </span>
                              </div>
                              <XCircle
                                className="text-gray-400 flex-shrink-0"
                                size={20}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Received Qty:</span>
                              <span>0</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const isMatch = item.quantity === comparison.orderedQty;

                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className={`p-4 rounded-lg border-2 transition-colors min-h-[88px] flex items-center ${
                          isMatch
                            ? "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xs text-gray-900">
                                {item.name}
                              </span>
                              {!isMatch && (
                                <span className="text-xs text-red-700">
                                  Short {comparison.orderedQty - item.quantity}{" "}
                                  units
                                </span>
                              )}
                            </div>
                            {isMatch ? (
                              <Check
                                className="text-green-500 flex-shrink-0"
                                size={20}
                              />
                            ) : (
                              <AlertTriangle
                                className="text-red-500 flex-shrink-0"
                                size={20}
                              />
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-gray-700">
                            <span>Received Qty:</span>
                            <span>{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {extraReceiptItems.map((item, index) => (
                    <div
                      key={`extra-receipt-${item.name}-${index}`}
                      className="p-4 rounded-lg border-2 border-orange-300 bg-orange-50 transition-colors min-h-[88px] flex items-center"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs text-gray-900">
                              {item.name}
                            </span>
                            <span className="text-xs text-orange-700">
                              Not in order
                            </span>
                          </div>
                          <XCircle
                            className="text-orange-500 flex-shrink-0"
                            size={20}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-700">
                          <span>Received Qty:</span>
                          <span>{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Order Date</p>
                <p className="text-xs text-gray-900">
                  {formatDateTime(order.orderDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Created By</p>
                <p className="text-xs text-gray-900">
                  {order.createdByUsername || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Created At</p>
                <p className="text-xs text-gray-900">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Notes</p>
              <p className="text-xs text-gray-900">{order.notes || "-"}</p>
            </div>

            {order.status === "Rejected" && (
              <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
                <XCircle size={16} className="text-red-600 mt-0.5" />
                <div className="text-xs text-red-700">
                  This order has been rejected.
                </div>
              </div>
            )}
          </div>

          {canReview && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block mb-2 text-xs text-gray-700">
                Rejection Comment
              </label>
              <textarea
                value={rejectionComment}
                onChange={(event) => setRejectionComment(event.target.value)}
                disabled={isUpdatingStatus}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Enter reason for rejection..."
              />

              {actionMessage && (
                <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {actionMessage}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isUpdatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                >
                  <CheckCircle size={20} />
                  <span>{isUpdatingStatus ? "Processing..." : "Approve"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isUpdatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
                >
                  <XCircle size={20} />
                  <span>{isUpdatingStatus ? "Processing..." : "Reject"}</span>
                </button>
              </div>
            </div>
          )}

          {canResubmitRejected && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm text-gray-900 mb-2">
                Rejected Order Actions
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                You can modify this rejected order on a dedicated page and
                resubmit it, or delete it.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/procurement/purchase-order/${orderId}/resubmit`)
                  }
                  disabled={isUpdatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />
                  <span>Modify & Resubmit</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteOrder}
                  disabled={isUpdatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                  <span>
                    {isUpdatingStatus ? "Processing..." : "Delete Order"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PurchaseOrderDetailsPage;
