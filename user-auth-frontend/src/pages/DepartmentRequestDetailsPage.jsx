import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  PackageOpen,
  RefreshCcw,
  Trash2,
  User,
  Package,
  CheckCircle,
} from "lucide-react";
import useAxios from "../hooks/useAxios";
import { departmentRequestApi } from "../util/api";

const DRAFT_KEY = "departmentRequestDraft";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDate(value)} ${formatTime(value)}`;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.title || fallback;
};

function DepartmentRequestDetailsPage() {
  const [comment, setComment] = useState("");
  const [approvedQtyByItemId, setApprovedQtyByItemId] = useState({});
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [acting, setActing] = useState(false);

  const navigate = useNavigate();
  const { requestId } = useParams();
  const { data: currentUser } = useAxios({ method: "get", url: "/Users/me" });
  const normalizedRole =
    currentUser?.role === "User" ? "DepartmentMember" : currentUser?.role;
  const canReview =
    normalizedRole === "Admin" || normalizedRole === "WarehouseStaff";
  const isDepartmentMember =
    normalizedRole === "DepartmentMember" || normalizedRole === "User";
  const backPath = canReview
    ? "/department-request"
    : "/department-request/mine";

  const loadRequest = async () => {
    if (!requestId) {
      setError("Missing request ID.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await departmentRequestApi.getByRequestNumber(requestId);
      const nextRequest = res.data || null;
      setRequest(nextRequest);
      if (nextRequest && Array.isArray(nextRequest.items)) {
        const nextApprovedMap = {};
        nextRequest.items.forEach((item) => {
          const requestedQty = Math.max(0, Number(item.quantityRequested) || 0);
          const approvedQty =
            item.quantityApproved !== undefined && item.quantityApproved !== null
              ? Number(item.quantityApproved)
              : requestedQty;

          nextApprovedMap[item.id] =
            nextRequest.status === "Pending Acceptance"
              ? requestedQty
              : approvedQty;
        });
        setApprovedQtyByItemId(nextApprovedMap);
      } else {
        setApprovedQtyByItemId({});
      }
      setError("");
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to load department request details."),
      );
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const getStatusBadgeClassName = (status) => {
    if (status === "Rejected" || status === "Accepted - Awaiting Restock") {
      return "bg-red-50 text-red-700 border border-red-200";
    }
    if (status === "Pending Acceptance" || status === "Accepted / Processing") {
      return "bg-amber-50 text-amber-700 border border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border border-blue-200";
  };

  const statusTimeline = useMemo(() => {
    const status = request?.status;
    const isPending = status === "Pending Acceptance";
    const isAccepted = status === "Accepted / Processing";
    const isReady = status === "Ready for Delivery";
    const isDispatched = status === "Dispatched";
    const isCompleted = status === "Completed";

    const acceptedReached =
      isAccepted || isReady || isDispatched || isCompleted;
    const readyReached = isReady || isDispatched || isCompleted;
    const dispatchedReached = isDispatched || isCompleted;

    const getState = (reached, inProgress) => {
      if (reached) return "finished";
      if (inProgress) return "in-progress";
      return "waiting";
    };

    return [
      {
        id: 1,
        title: "Pending Acceptance",
        subtitle: request?.requestedByUsername || "-",
        time: formatDateTime(request?.requestedAt),
        state: "finished",
      },
      {
        id: 2,
        title: "Accepted / Processing",
        subtitle: acceptedReached ? "Reviewed" : null,
        time: acceptedReached ? "" : "",
        state: getState(acceptedReached, isPending),
      },
      {
        id: 3,
        title: "Ready for Delivery",
        subtitle: readyReached ? "Ready" : null,
        time: "",
        state: getState(readyReached, isAccepted),
      },
      {
        id: 4,
        title: "Dispatched",
        subtitle: dispatchedReached ? "Dispatched" : null,
        time: dispatchedReached ? formatDateTime(request?.dispatchedAt) : "",
        state: getState(dispatchedReached, isReady),
      },
      {
        id: 5,
        title: "Completed",
        subtitle: isCompleted ? "Completed" : null,
        time: "",
        state: getState(isCompleted, isDispatched),
      },
    ];
  }, [request]);

  const getProgressPercentage = () => {
    const finishedStepCount = statusTimeline.filter(
      (step) => step.state === "finished",
    ).length;
    return Math.max(0, ((finishedStepCount - 1) / 4) * 100);
  };

  const requestItems = useMemo(() => {
    if (!Array.isArray(request?.items)) return [];
    return request.items.map((item) => {
      const fallbackName =
        item.description?.split(" - ")?.[0] || item.description || "-";
      return {
        id: item.id,
        name: item.medicationName || fallbackName,
        specification: item.strength
          ? `${item.strength}/${item.dosageForm || "-"}`
          : `${item.unit || "-"} - ${item.dosageForm || "-"}`,
        requestedQty: item.quantityRequested,
        approvedQty: item.quantityApproved,
        availableStock: item.stockQuantity !== undefined && item.stockQuantity !== null ? item.stockQuantity : "-",
        batchNumber: item.batchNumber || "-",
        expiryDate: item.expiryDate 
          ? new Date(item.expiryDate).toLocaleDateString() 
          : "-",
      };
    });
  }, [request]);

  const isOwnRejectedRequest =
    Boolean(request) &&
    isDepartmentMember &&
    request.status === "Rejected" &&
    request.requestedByUserId === currentUser?.id;

  const handleResubmitOwnRequest = async () => {
    if (!request || !isOwnRejectedRequest) return;

    setError("");
    setMessage("");
    setActing(true);

    try {
      const draftItems = requestItems.map((item) => ({
        id: `resubmit-${item.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: item.name,
        specification: item.specification || "",
        quantityRequested: Math.max(1, Number(item.requestedQty) || 1),
      }));

      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          items: draftItems,
          departmentId: request.departmentId ? String(request.departmentId) : "",
          notes: request.notes || "",
        }),
      );

      navigate("/department-request/new", {
        state: {
          message: "Rejected request loaded. Please review and submit again.",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to prepare re-submit draft."));
    } finally {
      setActing(false);
    }
  };

  const handleDeleteOwnRequest = async () => {
    if (!request || !isOwnRejectedRequest) return;

    if (!window.confirm("Delete this rejected request? This cannot be undone.")) {
      return;
    }

    setError("");
    setMessage("");
    setActing(true);

    try {
      await departmentRequestApi.delete(request.requestNumber);
      navigate("/department-request/mine", {
        replace: true,
        state: { message: "Rejected request deleted successfully." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete request."));
    } finally {
      setActing(false);
    }
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!request?.requestNumber || !canReview || isUpdating) return;

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        status: nextStatus,
        notes: comment.trim() || null,
      };

      if (nextStatus === "Accepted / Processing" && Array.isArray(request?.items)) {
        payload.approvedItems = request.items.map((item) => {
          const requestedQty = Math.max(0, Number(item.quantityRequested) || 0);
          const rawApprovedQty = Number(approvedQtyByItemId[item.id]);
          const normalizedApprovedQty = Number.isFinite(rawApprovedQty)
            ? Math.min(requestedQty, Math.max(0, rawApprovedQty))
            : requestedQty;

          return {
            itemId: item.id,
            quantityApproved: normalizedApprovedQty,
          };
        });
      }

      await departmentRequestApi.updateStatus(request.requestNumber, payload);
      setMessage(`Request status updated to ${nextStatus}.`);
      await loadRequest();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update request status."));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <button
          onClick={() => navigate(backPath)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <PackageOpen size={14} />
        <span>Department Request / Request Details</span>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Loading request details...
        </div>
      ) : !request ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-xs text-gray-500">
          Request not found.
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
                  style={{
                    width: `${getProgressPercentage()}%`,
                  }}
                />
              </div>

              <div className="relative flex justify-between">
                {statusTimeline.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex flex-col items-center"
                    style={{ minWidth: "120px" }}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 transition-all
                        ${
                          step.state === "finished"
                            ? "bg-blue-500 text-white"
                            : "bg-white border-2 border-gray-300 text-gray-400"
                        }
                      `}
                    >
                      {step.state === "finished" ? (
                        <Check size={20} />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>

                    <p
                      className={`mb-1 text-center text-xs ${
                        step.state === "waiting"
                          ? "text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </p>

                    {step.subtitle && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">{step.subtitle}</p>
                        {step.time && (
                          <p className="text-xs text-gray-500">{step.time}</p>
                        )}
                      </div>
                    )}

                    {step.state === "waiting" && !step.subtitle && (
                      <p className="text-xs text-gray-400">Waiting</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-gray-900 mb-2">{request.requestNumber}</h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded text-xs ${getStatusBadgeClassName(
                      request.status,
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
              {canReview ? (
                <div className="flex gap-2">
                  {request.status === "Pending Acceptance" && (
                    <>
                      <button
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                        onClick={() => handleUpdateStatus("Rejected")}
                        disabled={isUpdating}
                      >
                        Reject Request
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                        onClick={() =>
                          handleUpdateStatus("Accepted / Processing")
                        }
                        disabled={isUpdating}
                      >
                        Accept Request
                      </button>
                    </>
                  )}
                  {request.status === "Accepted / Processing" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => handleUpdateStatus("Ready for Delivery")}
                      disabled={isUpdating}
                    >
                      Mark Ready for Delivery
                    </button>
                  )}
                  {request.status === "Ready for Delivery" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => handleUpdateStatus("Dispatched")}
                      disabled={isUpdating}
                    >
                      Dispatch
                    </button>
                  )}
                  {request.status === "Dispatched" && (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => handleUpdateStatus("Completed")}
                      disabled={isUpdating}
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              ) : isOwnRejectedRequest ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResubmitOwnRequest}
                    disabled={acting}
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-xs hover:bg-blue-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <RefreshCcw size={14} />
                    Re-submit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOwnRequest}
                    disabled={acting}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-xs hover:bg-red-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Building2 size={12} />
                  Department
                </div>
                <div className="text-xs text-gray-900">
                  {request.departmentName || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <User size={12} />
                  Requested By
                </div>
                <div className="text-xs text-gray-900">
                  {request.requestedByUsername || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Request Date
                </div>
                <div className="text-xs text-gray-900">
                  {formatDate(request.requestedAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  Request Time
                </div>
                <div className="text-xs text-gray-900">
                  {formatTime(request.requestedAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Dispatch Date
                </div>
                <div className="text-xs text-gray-900">
                  {formatDate(request.dispatchedAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  Dispatch Time
                </div>
                <div className="text-xs text-gray-900">
                  {formatTime(request.dispatchedAt)}
                </div>
              </div>
            </div>

            {request.status === "Rejected" && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Rejected By</div>
                  <div className="text-xs text-gray-900">
                    {request.rejectedByUsername || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Rejected At</div>
                  <div className="text-xs text-gray-900">
                    {request.rejectedAt ? formatDateTime(request.rejectedAt) : "-"}
                  </div>
                </div>
              </div>
            )}

            {request.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-700">
                <span className="text-gray-500">Notes: </span>
                {request.notes}
              </div>
            )}

            {(request.status === "Pending Acceptance" ||
              request.status === "Accepted / Processing") && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <h3 className="text-sm text-gray-900 mb-4">
                  {request.status === "Pending Acceptance"
                    ? "Add Comment (Optional)"
                    : "Notes"}
                </h3>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    request.status === "Pending Acceptance"
                      ? "Enter acceptance or rejection comments..."
                      : "Add any notes..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm text-gray-900">Request Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Medicine Name
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                       Unit & Dosage Form
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Requested Qty
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Available Stock
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Approved Qty
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Batch Number
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs text-gray-600">
                      Expiry Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!requestItems.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-6 text-xs text-gray-500"
                      >
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    requestItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.name}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.specification}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.requestedQty}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.availableStock}
                        </td>
                        <td className="px-5 py-3 text-xs text-green-600 align-middle">
                          {canReview && request.status === "Pending Acceptance" ? (
                            <input
                              type="number"
                              min="0"
                              max={item.requestedQty}
                              value={
                                approvedQtyByItemId[item.id] !== undefined
                                  ? approvedQtyByItemId[item.id]
                                  : item.requestedQty
                              }
                              onChange={(event) => {
                                const rawValue = Number(event.target.value);
                                const maxValue = Math.max(0, Number(item.requestedQty) || 0);
                                const normalizedValue = Number.isFinite(rawValue)
                                  ? Math.min(maxValue, Math.max(0, rawValue))
                                  : 0;

                                setApprovedQtyByItemId((prev) => ({
                                  ...prev,
                                  [item.id]: normalizedValue,
                                }));
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isUpdating}
                            />
                          ) : (
                            item.approvedQty
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.batchNumber}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-900 align-middle">
                          {item.expiryDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </>
      )}
    </div>
  );
}

export default DepartmentRequestDetailsPage;
